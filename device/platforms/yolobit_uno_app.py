from event_manager import event_manager
from homebit3_dht20 import DHT20
from homebit3_lcd1602 import LCD1602
from machine import RTC
import ntptime
import time
from mqtt import mqtt
from yolobit import pin1, pin2, pin13, translate

from registries.yolobit_registry import get_modules


def build_context():
    lcd1602 = LCD1602()
    dht20 = DHT20()

    return {
        "mqtt": mqtt,
        "event_manager": event_manager,
        "dht20": dht20,
        "rtc": RTC,
        "pin1": pin1,
        "pin2": pin2,
        "pump_pin": pin13,
        "translate": translate,
        "lcd1602": lcd1602,
    }


def init_board(context):
    event_manager.reset()

    mqtt.connect_wifi("HCMUT-MEETING", "hcmut@meeting")
    mqtt.connect_broker(
        server="mqtt.ohstem.vn",
        port=1883,
        username="DADN_CNPM_1",
        password="",
    )

    ntptime.settime()
    (
        year,
        month,
        mday,
        week_of_year,
        hour,
        minute,
        second,
        millisecond,
    ) = RTC().datetime()
    RTC().init((year, month, mday, week_of_year, hour + 7, minute, second, millisecond))
    context["lcd1602"].clear()


def main():
    context = build_context()
    init_board(context)

    for module in get_modules():
        module.setup(context)

    while True:
        mqtt.check_message()
        event_manager.run()
        time.sleep_ms(1000)
        time.sleep_ms(10)


if __name__ == "__main__":
    main()
