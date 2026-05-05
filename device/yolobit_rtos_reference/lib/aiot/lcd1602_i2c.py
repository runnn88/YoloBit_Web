"""
LCD1602 I2C driver (PCF8574) for MicroPython.
Fallback when firmware does not provide aiot_lcd1602/lcd_1602.
Default I2C: yolobit pin19(SCL), pin20(SDA), address 0x27.
"""

from time import sleep_ms
from machine import SoftI2C, Pin
from yolobit import pin19, pin20


class LCD1602I2C:
    def __init__(self, addr=0x27, cols=16, rows=2):
        self.addr = addr
        self.cols = cols
        self.rows = rows
        self.i2c = SoftI2C(scl=Pin(pin19.pin), sda=Pin(pin20.pin), freq=100000)
        self._backlight = 0x08
        self._init_lcd()

    def _write(self, data):
        self.i2c.writeto(self.addr, bytes([data | self._backlight]))

    def _pulse(self, data):
        self._write(data | 0x04)
        sleep_ms(1)
        self._write(data & ~0x04)
        sleep_ms(1)

    def _write4(self, nibble, rs):
        data = (nibble & 0xF0) | (0x01 if rs else 0x00)
        self._write(data)
        self._pulse(data)

    def _send(self, value, rs):
        self._write4(value & 0xF0, rs)
        self._write4((value << 4) & 0xF0, rs)

    def command(self, cmd):
        self._send(cmd, 0)
        sleep_ms(2)

    def write_char(self, ch):
        self._send(ord(ch), 1)

    def _init_lcd(self):
        sleep_ms(50)
        self._write4(0x30, 0)
        sleep_ms(5)
        self._write4(0x30, 0)
        sleep_ms(1)
        self._write4(0x30, 0)
        sleep_ms(1)
        self._write4(0x20, 0)  # 4-bit mode

        self.command(0x28)  # 2 lines, 5x8 font
        self.command(0x0C)  # display on, cursor off
        self.command(0x06)  # entry mode
        self.clear()

    def clear(self):
        self.command(0x01)
        sleep_ms(2)

    def move_to(self, col, row):
        row_offsets = [0x00, 0x40, 0x14, 0x54]
        self.command(0x80 | (col + row_offsets[row]))

    def putstr(self, text):
        for ch in text:
            self.write_char(ch)

    def backlight_on(self):
        self._backlight = 0x08
        self._write(0)

    def backlight_off(self):
        self._backlight = 0x00
        self._write(0)
