# Yolo:Bit RTOS Study Notes

This file records the full behavior of `Yolobit-RTOS-Lab-main` so the later
implementation in `YoloBit_Web` can follow the same control model.

## Project interpretation

The RTOS lab is not a true preemptive RTOS. It is a cooperative timed-task
system built around an event manager.

The key pattern is:

- each feature lives in its own `task_*.py` file
- each task file exposes `task_init()`
- each task file exposes `task_run()`
- `main.py` calls all `task_init()` functions once
- `main.py` schedules all `task_run()` functions with timer events
- the board stays alive in a single `while True` loop that repeatedly calls
  `event_manager.run()` and then sleeps briefly

That means the board behavior is modular and time-sliced rather than being
implemented as one large blocking script.

## Main control loop

From `main.py`, the control pattern is:

```python
import time
from event_manager import *
import config
import task1
import task2
import task_gpio
import task_i2c
import task_lcd

event_manager.reset()

task1.task_init()
task2.task_init()
task_gpio.task_init()
task_i2c.task_init()
task_lcd.task_init()

event_manager.add_timer_event(config.INTERVAL_TASK1_MS, task1.task_run)
event_manager.add_timer_event(config.INTERVAL_TASK2_MS, task2.task_run)
event_manager.add_timer_event(config.INTERVAL_TASK_GPIO_MS, task_gpio.task_run)
event_manager.add_timer_event(config.INTERVAL_TASK_I2C_MS, task_i2c.task_run)
event_manager.add_timer_event(config.INTERVAL_TASK_LCD_MS, task_lcd.task_run)

while True:
    event_manager.run()
    time.sleep_ms(10)
```

Important architectural takeaways:

- `main.py` is only an orchestrator
- task timing is centralized in `config.py`
- each feature is isolated in its own module
- no task owns the whole loop

## Task timing from config.py

The RTOS lab stores task periods in `config.py`.

Confirmed values from the lab:

- `INTERVAL_TASK1_MS = 1000`
- `INTERVAL_TASK2_MS = 500`
- `INTERVAL_TASK_GPIO_MS = 100`
- `INTERVAL_TASK_I2C_MS = 2000`
- `INTERVAL_TASK_LCD_MS = 200`
- `INTERVAL_TASK_MQTT_MS = 5000`
- `INTERVAL_TASK_NTP_MS = 5000`
- `INTERVAL_TASK_AIOT_MS = 3000`
- `INTERVAL_TASK_EVENT_MS = 2000`
- `INTERVAL_TASK_AI_MS = 3000`
- `INTERVAL_TASK_COLLECT_MS = 2000`

Important interpretation:

- GPIO/button polling is fast at `100ms`
- LCD refresh is relatively fast at `200ms`
- I2C sensor reads are slower at `2000ms`
- network-style tasks are treated as periodic maintenance tasks, not as the
  center of the runtime

## How the event manager is used

Two event manager implementations exist in the RTOS repo:

1. `event_manager.py`
   - a minimal local scheduler / polyfill
   - supports timer events and a single central `run()` loop

2. `lib/event_manager_ohstem.py`
   - the fuller OhStem-style event manager
   - supports timer, condition, and message events
   - may run callbacks in `_thread`

The main lab loop uses:

```python
from event_manager import *
```

That means the board app is designed so the top-level scheduler can still work
if the firmware does not already provide an event manager module.

The richer message-event system is demonstrated separately in `task_event.py`.

## Task 1: display heartbeat behavior

`task1.py` is the simplest example of the task contract.

Behavior:

- imports `from yolobit import *`
- keeps one module-level `status`
- `task_init()` resets status to `0`
- `task_run()` toggles status and alternates between:
  - `display.show(Image.HEART)`
  - `display.show(Image.HEART_SMALL)`

Architectural takeaway:

- display effects are implemented as periodic task logic
- persistent task state is kept in module globals

## Task 2: RGB indicator behavior

`task2.py` shows optional hardware handling.

Behavior:

- tries to import `RGBLed` from `lib.aiot.aiot_rgbled`
- tries to import Yolo:Bit symbols from `yolobit`
- if RGB hardware is available, it initializes `RGBLed(pin14.pin, 4)`
- `task_run()` toggles between red and blue on all LEDs
- if RGB hardware is missing, it prints status messages instead of crashing

Architectural takeaway:

- tasks are written to degrade gracefully when hardware is absent
- hardware init belongs in `task_init()`
- periodic visual updates belong in `task_run()`

## GPIO control model

`task_gpio.py` is the clearest example of local device control.

Behavior:

- imports `from yolobit import *`
- imports `Pin` from `machine`
- creates `relay_pin = Pin(2, Pin.OUT)` in `task_init()`
- tracks:
  - `led_state`
  - `relay_state`
  - `_last_a`
  - `_last_b`
- uses helper `_pressed_now(button, last)` for edge detection
- `task_run()`:
  - reads button A and button B
  - detects rising-edge presses only
  - button A toggles display state
  - button B toggles `relay_pin.value(relay_state)`

Practical conclusions:

- local control is implemented by polling input devices on a timer
- button events are not interrupt-driven here; they are edge-detected in software
- actuator control uses raw `machine.Pin` writes
- the relay example pin in the lab is `GPIO2`

## I2C and sensor model

`task_i2c.py` is the main sensor polling reference.

Behavior:

- imports `SoftI2C` and `Pin` from `machine`
- imports `DHT20` from `lib.aiot.aiot_dht20`
- imports `pin19` and `pin20` from `yolobit`
- builds the bus with:

```python
i2c = SoftI2C(scl=Pin(pin19.pin), sda=Pin(pin20.pin), freq=100000)
```

- scans the bus once with `i2c.scan()`
- tries to initialize `DHT20()`
- stores shared module-level values:
  - `latest_temp`
  - `latest_hum`
  - `sensor_ok`
- in `task_run()`:
  - reads temperature and humidity
  - updates shared state
  - logs errors without killing the whole loop
  - retries DHT20 init periodically if startup fails

Confirmed hardware details from this path:

- I2C SCL in the reference setup: `pin19`
- I2C SDA in the reference setup: `pin20`
- DHT20 address from the driver: `0x38`

Architectural takeaway:

- sensor acquisition is separated from presentation
- sensor data is stored in module globals for other tasks to use
- init retry behavior is built into the task instead of blocking startup forever

## DHT20 implementation details

From `lib/aiot/aiot_dht20.py`:

- bus is created with `SoftI2C(scl=Pin(pin19.pin), sda=Pin(pin20.pin))`
- status byte is read from `0x38`
- init commands:
  - `0xA8 0x00 0x00`
  - `0xBE 0x08 0x00`
- measurement command:
  - `0xAC 0x33 0x00`
- driver waits until the busy bit clears
- temperature and humidity are derived from the returned 7-byte frame

This is useful because even if we later replace the helper library, the actual
DHT20 wire protocol and address are already known.

## LCD output model

`task_lcd.py` is not responsible for reading sensors. It is a presentation task.

Behavior:

- imports `task_i2c`
- tries multiple LCD driver styles:
  1. `aiot_lcd1602`
  2. `lcd_1602`
  3. fallback `lib.aiot.lcd1602_i2c`
- the fallback driver creates another `SoftI2C` bus on `pin19/pin20`
- it scans for LCD addresses in this order:
  - `0x21`
  - `0x24`
  - `0x27`
  - `0x3F`
- `task_run()` refreshes lines using values from `task_i2c.latest_temp`,
  `task_i2c.latest_hum`, and `task_i2c.sensor_ok`

Confirmed LCD address hints from the lab:

- likely addresses: `0x21`, `0x24`, `0x27`, `0x3F`

Architectural takeaway:

- sensor read logic and LCD rendering are separate modules
- the LCD task consumes shared sensor state rather than querying hardware itself
- the lab is written to tolerate multiple firmware/library environments

## AIOT test task model

`task_aiot.py` is a hardware capability test task.

Behavior:

- tries to import `DHT20`
- tries to import `RGBLed` and `yolobit`
- in `task_init()`:
  - initializes DHT20 if present
  - initializes `RGBLed(pin14.pin, 4)` if present
- in `task_run()`:
  - if DHT20 exists, print sensor readings
  - else if RGB exists, cycle LED colors
  - else print that the AIOT library is available but no compatible hardware was found

Architectural takeaway:

- one task can branch its runtime behavior based on hardware availability
- the lab treats missing hardware as a normal test condition, not a fatal error

## MQTT task model

`task_mqtt.py` shows how network behavior is isolated.

Behavior:

- tries to import `mqtt` from `lib.mqtt`
- in `task_init()`:
  - checks `config.py` for Wi-Fi settings
  - connects Wi-Fi if configured
  - connects MQTT broker if configured
- in `task_run()`:
  - calls `mqtt.check_message()`
  - periodically logs Wi-Fi/MQTT state

Architectural takeaway:

- MQTT is not the scheduler backbone
- MQTT is a periodic service task layered onto the board runtime
- configuration is optional and externalized in `config.py`

## NTP task model

`task_ntp.py` follows the same pattern.

Behavior:

- imports `set_time_from_ntp` and `get_time_str`
- in `task_init()`:
  - if Wi-Fi already exists, tries one initial time sync
- in `task_run()`:
  - prints the current RTC time string each period

Architectural takeaway:

- NTP is treated as a helper task, not a startup prerequisite
- the lab assumes board services can be layered independently

## Event test task model

`task_event.py` demonstrates the richer message-event API.

Behavior:

- imports `event_manager` from `lib.event_manager_ohstem`
- registers a message callback with `add_message_event(0, _on_message_0)`
- in `task_run()`, calls `broadcast_message(0)`
- callback prints a confirmation line

Architectural takeaway:

- the fuller event manager supports message-based orchestration
- this message mechanism is separate from the simpler timer-only top-level loop

## Library pack usage model

From `lib/README.md`, the RTOS repo expects the whole `lib/` tree to be uploaded
with the project and then imported locally.

That means the lab's dependency model is:

- board firmware supplies low-level modules such as `machine` and `yolobit`
- project folder supplies helper libraries under `lib/`
- code imports helpers from `lib.*`

Useful imports confirmed by the lab:

```python
from lib.mqtt import mqtt
from lib.ntp_helper import set_time_from_ntp, get_time, get_time_str
from lib.event_manager_ohstem import event_manager
from lib.aiot.aiot_dht20 import DHT20
from lib.aiot.aiot_rgbled import RGBLed
```

## What the lab tells us about control strategy

The most important control ideas from the RTOS lab are:

- use a central scheduler loop
- split features into isolated task modules
- do hardware setup once in `task_init()`
- do repeated work in `task_run()`
- keep per-task state in module globals
- poll buttons and sensors on intervals
- keep presentation tasks separate from acquisition tasks
- treat network features as optional service tasks
- tolerate missing hardware and log cleanly instead of crashing

## Confirmed hardware clues from the Yolo:Bit lab

These are the strongest concrete hardware clues we have from the RTOS project:

- I2C SCL: `pin19`
- I2C SDA: `pin20`
- DHT20 address: `0x38`
- LCD candidate addresses: `0x21`, `0x24`, `0x27`, `0x3F`
- RGB example pin: `pin14.pin`
- relay example pin in `task_gpio.py`: `Pin(2, Pin.OUT)`

## Copied local library pack in this repo

The RTOS helper files were copied into:

- `device/yolobit_rtos_reference/event_manager.py`
- `device/yolobit_rtos_reference/lib/`

That copied pack includes:

- `lib/event_manager_ohstem.py`
- `lib/mqtt.py`
- `lib/ntp_helper.py`
- `lib/umqtt_simple.py`
- `lib/umqtt_robust.py`
- `lib/utility.py`
- `lib/aiot/aiot_dht20.py`
- `lib/aiot/aiot_rgbled.py`
- `lib/aiot/lcd1602_i2c.py`

## Practical conclusion for later implementation

When implementation starts later, the most faithful way to mirror the lab is:

- keep one board entry point that only orchestrates modules
- model each feature as init + periodic run
- separate control, sensing, display, and connectivity into different modules
- treat the copied Yolo:Bit lab libraries as the local dependency source
- use the hardware mappings above as the first concrete targets for Yolo:Bit
  integration
