export const LIBRARY_FREE_USB_ECHO_PRESET = `import sys
import uselect
import time


def read_terminal_input():
    serial_poll = uselect.poll()
    serial_poll.register(sys.stdin, uselect.POLLIN)

    incoming = ""
    if serial_poll.poll(0):
        incoming = sys.stdin.read(1)

        while serial_poll.poll(0):
            incoming += sys.stdin.read(1)

    serial_poll.unregister(sys.stdin)
    return incoming


print("USB controller ready")

while True:
    message = read_terminal_input().strip()
    if message:
        print("USB ECHO:", message)
    time.sleep_ms(100)
`;

export const SAMPLE_BASED_CONTROLLER_PRESET = `from wifi import __wifi__
from machine import RTC
import ntptime
import time
from yolobit import *
button_a.on_pressed = None
button_b.on_pressed = None
button_a.on_pressed_ab = button_b.on_pressed_ab = -1
from homebit3_rgbled import RGBLed
from event_manager import *
import sys
import uselect

tiny_rgb = RGBLed(pin0.pin, 4)

event_manager.reset()


def read_terminal_input():
  spoll = uselect.poll()
  spoll.register(sys.stdin, uselect.POLLIN)

  incoming = ''
  if spoll.poll(0):
    incoming = sys.stdin.read(1)

    while spoll.poll(0):
      incoming = incoming + sys.stdin.read(1)

  spoll.unregister(sys.stdin)
  return incoming


def on_event_timer_callback_usb():
  global chuoi_nhan, lenh_nhan, trang_thai
  chuoi_nhan = read_terminal_input()
  if len(chuoi_nhan) > 0:
    print('USB ECHO:', chuoi_nhan)
    lenh_nhan = chuoi_nhan[0]
    if lenh_nhan == 'A':
      trang_thai = 'LA VANG'
      tiny_rgb.show(0, hex_to_rgb('#ffff00'))
      pin4.servo_write(0)
    if lenh_nhan == 'B':
      trang_thai = 'LA XANH'
      tiny_rgb.show(0, hex_to_rgb('#00ff00'))
      pin4.servo_write(180)


event_manager.add_timer_event(200, on_event_timer_callback_usb)

if True:
  __wifi__.connect_wifi('HCMUT-MEETING', 'hcmut@meeting')
  ntptime.settime()
  (year, month, mday, week_of_year, hour, minute, second, milisecond) = RTC().datetime()
  RTC().init((year, month, mday, week_of_year, hour + 7, minute, second, milisecond))
  chuoi_nhan = ''
  lenh_nhan = ''
  trang_thai = 'LA VANG'
  tiny_rgb.show(0, hex_to_rgb('#ffff00'))

while True:
  event_manager.run()
  time.sleep_ms(10)
`;
