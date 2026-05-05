const { EVENTS } = require("../../../../shared/events");

const DEVICE_ID = "yolobit-001";
const SENSOR_DEVICE_ID = "yolobit-sensors-001";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeLine(line) {
  return String(line || "")
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/\r/g, "")
    .trim();
}

class DeviceService {
  constructor({ store, eventBus, serialGateway, config, sensorService }) {
    this.store = store;
    this.eventBus = eventBus;
    this.serialGateway = serialGateway;
    this.config = config;
    this.sensorService = sensorService;
    this.sensorPollTimer = null;
    this.sensorPollInFlight = false;
    this.tracebackBuffer = [];
  }

  setPump(enabled) {
    return this.setPumpState("pump-001", enabled);
  }

  async setPumpState(deviceId, enabled) {
    const nextState = this.store.updateState(deviceId, {
      connected: true,
      desiredEnabled: enabled,
      status: "serial_command_queued",
    });
    this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, nextState);

    const pinName = deviceId === "pump-001" ? "pin13" : "pin10";
    const script = [
      "from yolobit import " + pinName,
      `${pinName}.write_digital(${enabled ? 1 : 0})`,
      `print('PUMP_ACK|${deviceId}|${enabled ? 1 : 0}')`,
    ].join("\n");

    await this.sendExecScript(script);

    const confirmed = this.store.updateState(deviceId, {
      connected: true,
      desiredEnabled: enabled,
      reportedEnabled: enabled,
      status: "serial_command_sent",
    });

    this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, confirmed);
    return confirmed;
  }

  listState() {
    return this.store.getState();
  }

  async listSerialPorts() {
    return this.serialGateway.listPorts();
  }

  async connectYoloBit({ path, baudRate }) {
    this.stopSensorPolling();

    const connection = await this.serialGateway.connect({
      path: path || this.config.serial.defaultPath,
      baudRate: Number(baudRate) || this.config.serial.defaultBaudRate,
    });

    await this.initializeBoardSession();
    this.startSensorPolling();
    await this.requestSensorSnapshot();

    this.store.updateState("pump-001", {
      connected: true,
      status: "ready",
    });

    return this.store.updateState(DEVICE_ID, {
      connected: true,
      serialPath: connection.path,
      baudRate: connection.baudRate,
      status: "serial_connected",
      sensorError: "",
    });
  }

  async disconnectYoloBit() {
    this.stopSensorPolling();
    await this.serialGateway.disconnect();

    this.store.updateState("pump-001", {
      connected: false,
      status: "offline",
    });

    return this.store.updateState(DEVICE_ID, {
      connected: false,
      serialPath: "",
      baudRate: null,
      status: "serial_disconnected",
    });
  }

  async refreshSensors() {
    await this.requestSensorSnapshot();
    return this.store.updateState(DEVICE_ID, {
      status: "sensor_poll_requested",
    });
  }

  async setLeafState(stateCode) {
    const normalized = String(stateCode || "").trim().toUpperCase();

    if (!["A", "B"].includes(normalized)) {
      throw new Error("Leaf state command must be either 'A' or 'B'.");
    }

    const desiredLeafState = normalized === "A" ? "LA VANG" : "LA XANH";
    const color = normalized === "A" ? "(255, 255, 0)" : "(0, 255, 0)";
    const angle = normalized === "A" ? 0 : 180;
    const script = [
      "from yolobit import pin4, pin14",
      "from lib.aiot.aiot_rgbled import RGBLed",
      "rgb = RGBLed(pin14.pin, 4)",
      `rgb.show(0, ${color})`,
      `pin4.servo_write(${angle})`,
      `print('LEAF_ACK|${normalized}')`,
    ].join("\n");

    await this.sendExecScript(script);

    const command = {
      deviceId: DEVICE_ID,
      transport: "usb-serial",
      message: normalized,
      desiredLeafState,
      timestamp: new Date().toISOString(),
    };

    this.store.addCommand(command);

    const nextState = this.store.updateState(DEVICE_ID, {
      desiredLeafState,
      reportedLeafState: desiredLeafState,
      lastCommand: normalized,
      status: "serial_command_sent",
    });

    this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, nextState);
    return nextState;
  }

  async sendRawSerial(commandText) {
    const command = String(commandText || "");

    if (!command.trim()) {
      throw new Error("A serial command is required.");
    }

    await this.sendLine(command);

    return this.store.updateState(DEVICE_ID, {
      lastCommand: command,
      status: "serial_command_sent",
    });
  }

  markSerialConnected(connection) {
    this.store.updateState("pump-001", {
      connected: true,
      status: "ready",
    });

    return this.store.updateState(DEVICE_ID, {
      connected: true,
      serialPath: connection.path,
      baudRate: connection.baudRate,
      status: "serial_connected",
    });
  }

  markSerialDisconnected() {
    this.stopSensorPolling();
    this.store.updateState("pump-001", {
      connected: false,
      status: "offline",
    });

    return this.store.updateState(DEVICE_ID, {
      connected: false,
      serialPath: "",
      baudRate: null,
      status: "serial_disconnected",
    });
  }

  handleSerialData(line) {
    const cleanLine = normalizeLine(line);
    if (!cleanLine) {
      return this.store.getState()[DEVICE_ID];
    }

    if (cleanLine.startsWith(">>>") || cleanLine === "OK") {
      return this.store.getState()[DEVICE_ID];
    }

    const nextState = this.store.updateState(DEVICE_ID, {
      connected: true,
      lastSerialMessage: cleanLine,
      status: "serial_data_received",
    });

    if (cleanLine.startsWith("YOLOBIT_DATA|")) {
      const parts = cleanLine.split("|");
      if (parts.length >= 5) {
        const [_, temp, humidity, soil, lux] = parts;
        const timestamp = new Date().toISOString();
        this.sensorService.ingestReading({ deviceId: SENSOR_DEVICE_ID, metric: "temp", value: Number(temp), timestamp });
        this.sensorService.ingestReading({ deviceId: SENSOR_DEVICE_ID, metric: "humidity", value: Number(humidity), timestamp });
        this.sensorService.ingestReading({ deviceId: SENSOR_DEVICE_ID, metric: "soil", value: Number(soil), timestamp });
        this.sensorService.ingestReading({ deviceId: SENSOR_DEVICE_ID, metric: "lux", value: Number(lux), timestamp });

        const updatedState = this.store.updateState(DEVICE_ID, {
          lastSerialMessage: cleanLine,
          lastSensorReadAt: timestamp,
          sensorError: "",
          status: "sensor_data_received",
        });
        this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, updatedState);
        this.sensorPollInFlight = false;
        return updatedState;
      }
    }

    if (cleanLine.startsWith("YOLOBIT_ERROR|")) {
      const updatedState = this.store.updateState(DEVICE_ID, {
        sensorError: cleanLine,
        status: "sensor_error",
      });
      this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, updatedState);
      this.sensorPollInFlight = false;
      return updatedState;
    }

    if (cleanLine.startsWith("Traceback")) {
      this.tracebackBuffer = [cleanLine];
      this.sensorPollInFlight = false;
      return nextState;
    }

    if (this.tracebackBuffer.length) {
      this.tracebackBuffer.push(cleanLine);
      const looksTerminal = /^(ValueError|NameError|TypeError|OSError|ImportError|Exception|SyntaxError):/.test(cleanLine);
      if (looksTerminal) {
        const errorMessage = this.tracebackBuffer.join(" | ");
        this.tracebackBuffer = [];
        const updatedState = this.store.updateState(DEVICE_ID, {
          sensorError: errorMessage,
          status: "serial_python_error",
        });
        this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, updatedState);
        return updatedState;
      }
    }

    if (cleanLine.startsWith("PUMP_ACK|")) {
      const [, pumpId, enabled] = cleanLine.split("|");
      const updatedPump = this.store.updateState(pumpId, {
        connected: true,
        reportedEnabled: enabled === "1",
        status: "serial_command_confirmed",
      });
      this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, updatedPump);
    }

    if (cleanLine === "YOLOBIT_READY") {
      const updatedState = this.store.updateState(DEVICE_ID, {
        status: "serial_repl_ready",
      });
      this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, updatedState);
      return updatedState;
    }

    this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, nextState);
    return nextState;
  }

  handleSerialError(error) {
    this.stopSensorPolling();
    this.store.updateState("pump-001", {
      connected: false,
      status: "offline",
    });

    return this.store.updateState(DEVICE_ID, {
      connected: false,
      status: "serial_error",
      sensorError: error.message || String(error),
      lastSerialMessage: error.message || String(error),
    });
  }

  async initializeBoardSession() {
    await delay(this.config.serial.startupDelayMs);
    await this.serialGateway.send("\x03\x03");
    await delay(this.config.serial.commandSpacingMs);
    await this.sendLine("print('YOLOBIT_READY')");
    await delay(this.config.serial.commandSpacingMs);
  }

  startSensorPolling() {
    this.stopSensorPolling();
    this.sensorPollTimer = setInterval(() => {
      this.requestSensorSnapshot().catch((error) => {
        this.handleSerialError(error);
      });
    }, this.config.serial.pollIntervalMs);
  }

  stopSensorPolling() {
    if (this.sensorPollTimer) {
      clearInterval(this.sensorPollTimer);
      this.sensorPollTimer = null;
    }
    this.sensorPollInFlight = false;
  }

  async requestSensorSnapshot() {
    if (this.sensorPollInFlight) {
      return;
    }

    this.sensorPollInFlight = true;
    this.store.updateState(DEVICE_ID, {
      status: "sensor_poll_requested",
    });

    const script = [
      "try:",
      "    import time",
      "    from machine import SoftI2C, Pin",
      "    from yolobit import pin19, pin20, pin1, pin2, translate",
      "    i2c = SoftI2C(scl=Pin(pin19.pin), sda=Pin(pin20.pin), freq=100000)",
      "    i2c.writeto(0x38, bytes([0xAC, 0x33, 0x00]))",
      "    time.sleep_ms(80)",
      "    data = i2c.readfrom(0x38, 7, True)",
      "    raw_h = ((data[1] << 16) | (data[2] << 8) | data[3]) >> 4",
      "    raw_t = ((data[3] << 16) | (data[4] << 8) | data[5]) & 0xFFFFF",
      "    temp = round((raw_t * 200 * 10 / 1024 / 1024 - 500) / 10, 1)",
      "    humidity = round((raw_h * 100 * 10 / 1024 / 1024) / 10, 1)",
      "    soil = round(translate(pin1.read_analog(), 0, 4096, 0, 100), 1)",
      "    lux = pin2.read_analog()",
      "    print('YOLOBIT_DATA|{}|{}|{}|{}'.format(temp, humidity, soil, lux))",
      "except Exception as error:",
      "    print('YOLOBIT_ERROR|{}|{}'.format(type(error).__name__, error))",
    ].join("\n");

    await this.sendExecScript(script);
  }

  async sendExecScript(script) {
    const command = `exec(${JSON.stringify(script)})`;
    await this.sendLine(command);
    await delay(this.config.serial.commandSpacingMs);
  }

  async sendLine(command) {
    const normalized = String(command || "").endsWith("\r\n") ? String(command) : `${String(command)}\r\n`;
    await this.serialGateway.send(normalized);
  }
}

module.exports = { DeviceService };
