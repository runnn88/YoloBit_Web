# IoT System Scaffold

Modular device layer + domain-driven backend + feature-based frontend + shared contracts.

## Structure

```text
iot-system/
├── device/
├── backend/
├── frontend/
└── shared/
```

## Design Goals

- Modular: each feature lives in its own module.
- Plug-in style: new sensors/devices register without core rewrites.
- Event-driven: MQTT is the backbone.
- Single source of truth: backend state layer owns live state.
- Clear contracts: shared topics and schemas are reused across layers.

## Extension Flow

1. Add a new device module in `device/modules/`.
2. Register it in `device/registry.py`.
3. Add shared topic/schema definitions in `shared/`.
4. Add a backend domain or extend an existing service/store.
5. Add a frontend feature and mount it in the dashboard.

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend now also supports direct USB serial communication with a YoloBit board. Install dependencies in
`backend/package.json`, especially:

- `serialport`
- `@serialport/parser-readline`

USB serial endpoints:

- `GET /api/devices/ports`
- `POST /api/devices/yolobit/connect`
- `POST /api/devices/yolobit/disconnect`
- `POST /api/devices/yolobit/leaf` with `{ "state": "A" }` or `{ "state": "B" }`
- `POST /api/devices/yolobit/serial` with `{ "command": "..." }`

## YoloBit UNO Mapping

Your original YoloBit script maps cleanly into the modular device layer:

- `device/platforms/yolobit_uno_app.py`: board-specific bootstrap
- `device/registries/yolobit_registry.py`: module registration
- `device/modules/yolobit_environment.py`: DHT20 + soil + light publishing
- `device/modules/yolobit_irrigation.py`: RTC-based pump scheduling

This keeps YoloBit-specific hardware logic isolated while preserving the same event-driven MQTT flow.

For the USB-serial sample that reacts to `A` and `B` commands, the YoloBit-side module requirements are listed in
[device/REQUIREMENTS.md](D:/Study/UniSemesters/252/DATH/YoloUNO_Web/device/REQUIREMENTS.md).

### Frontend

```bash
cd frontend
npm install
npm run dev
```
