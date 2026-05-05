# Yolo:Bit RTOS Control Summary

This is the shortest control-oriented summary of how `Yolobit-RTOS-Lab-main`
implements board behavior.

## Core pattern

- `main.py` is only a scheduler bootstrapper
- each feature is a `task_*.py` module
- each module exposes `task_init()` and `task_run()`
- `config.py` stores task intervals
- `event_manager.run()` is called forever in a loop

## Control channels used in the lab

### 1. Local buttons

From `task_gpio.py`:

- button A toggles display state
- button B toggles relay state
- button events are detected by polling and edge detection

### 2. Direct actuator output

From `task_gpio.py`:

- relay output is controlled with `Pin(2, Pin.OUT)`
- output state is changed with `relay_pin.value(relay_state)`

### 3. Sensor polling

From `task_i2c.py`:

- DHT20 is polled on a timer
- values are stored in shared module globals
- the I2C bus uses `pin19/pin20`

### 4. LCD rendering

From `task_lcd.py`:

- LCD task does not read sensors directly
- it consumes sensor state from `task_i2c`
- it refreshes the screen on its own timer

### 5. Optional connectivity

From `task_mqtt.py` and `task_ntp.py`:

- Wi-Fi, MQTT, and NTP are optional service tasks
- they are not the main runtime loop
- they are checked periodically like everything else

## Most reusable architectural ideas

- modular feature tasks
- central timer scheduler
- no blocking feature loop inside individual modules
- shared module state between producer and consumer tasks
- graceful handling when hardware is absent
