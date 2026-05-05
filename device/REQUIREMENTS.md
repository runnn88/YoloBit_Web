# Yolo:Bit Requirements

This project should not depend on downloading libraries from OhStem during setup or runtime.
If a required Yolo:Bit helper library is not open source or not available as a normal package,
we can vendor it into this repo from the local `Yolobit-RTOS-Lab-main` reference project.

## What we already copied into this repo

The following board-side support files were copied from `Yolobit-RTOS-Lab-main` into
`device/yolobit_rtos_reference`:

- `event_manager.py`
- `lib/event_manager_ohstem.py`
- `lib/mqtt.py`
- `lib/ntp_helper.py`
- `lib/umqtt_simple.py`
- `lib/umqtt_robust.py`
- `lib/utility.py`
- `lib/aiot/aiot_dht20.py`
- `lib/aiot/aiot_rgbled.py`
- `lib/aiot/lcd1602_i2c.py`

So for this project, these copied files can be treated as vendored local dependencies.
They do not need to be downloaded separately from OhStem.

## What may still need to exist on the board firmware

These are board-level modules or firmware features that are not provided by the copied `lib/` folder itself:

- `yolobit`
- `machine`
- `time`
- `ntptime`
- `neopixel`
- `_thread`

## What is no longer the right dependency list

The earlier assumptions below are not the right target for the rebuild:

- `homebit3_rgbled`
- other `homebit3_*` imports
- YoloUno-specific raw GPIO assumptions

## Practical direction

For the next implementation pass:

- we may use the locally copied Yolo:Bit RTOS helper files from `device/yolobit_rtos_reference`
- we should not rely on external OhStem downloads as part of project setup
- we should rebuild against Yolo:Bit, not YoloUno
