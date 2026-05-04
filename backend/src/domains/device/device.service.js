const { EVENTS } = require("../../../../shared/events");

class DeviceService {
  constructor({ store, eventBus, serialGateway, config }) {
    this.store = store;
    this.eventBus = eventBus;
    this.serialGateway = serialGateway;
    this.config = config;
  }

  setPump(enabled) {
    const nextState = this.store.updateState("pump-001", {
      desiredEnabled: enabled,
      status: "command_sent_unconfirmed",
    });
    this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, nextState);
    return nextState;
  }

  listState() {
    return this.store.getState();
  }

  async listSerialPorts() {
    return this.serialGateway.listPorts();
  }

  async connectYoloBit({ path, baudRate }) {
    const connection = await this.serialGateway.connect({
      path: path || this.config.serial.defaultPath,
      baudRate: Number(baudRate) || this.config.serial.defaultBaudRate,
    });

    return this.store.updateState("yolobit-uno-001", {
      connected: true,
      serialPath: connection.path,
      baudRate: connection.baudRate,
      status: "serial_connected",
    });
  }

  async disconnectYoloBit() {
    await this.serialGateway.disconnect();

    return this.store.updateState("yolobit-uno-001", {
      connected: false,
      serialPath: "",
      baudRate: null,
      status: "serial_disconnected",
    });
  }

  async setLeafState(stateCode) {
    const normalized = String(stateCode || "").trim().toUpperCase();

    if (!["A", "B"].includes(normalized)) {
      throw new Error("Leaf state command must be either 'A' or 'B'.");
    }

    await this.serialGateway.send(`${normalized}\n`);

    const desiredLeafState = normalized === "A" ? "LA VANG" : "LA XANH";
    const command = {
      deviceId: "yolobit-uno-001",
      transport: "usb-serial",
      message: normalized,
      desiredLeafState,
      timestamp: new Date().toISOString(),
    };

    this.store.addCommand(command);

    const nextState = this.store.updateState("yolobit-uno-001", {
      desiredLeafState,
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

    await this.serialGateway.send(`${command}\n`);

    const nextState = this.store.updateState("yolobit-uno-001", {
      lastCommand: command,
      status: "serial_command_sent",
    });

    return nextState;
  }

  markSerialConnected(connection) {
    return this.store.updateState("yolobit-uno-001", {
      connected: true,
      serialPath: connection.path,
      baudRate: connection.baudRate,
      status: "serial_connected",
    });
  }

  markSerialDisconnected() {
    return this.store.updateState("yolobit-uno-001", {
      connected: false,
      serialPath: "",
      baudRate: null,
      status: "serial_disconnected",
    });
  }

  handleSerialData(line) {
    const nextState = this.store.updateState("yolobit-uno-001", {
      connected: true,
      lastSerialMessage: line,
      status: "serial_data_received",
    });

    this.eventBus.emit(EVENTS.DEVICE_STATE_CHANGED, nextState);
    return nextState;
  }

  handleSerialError(error) {
    return this.store.updateState("yolobit-uno-001", {
      connected: false,
      status: "serial_error",
      lastSerialMessage: error.message || String(error),
    });
  }
}

module.exports = { DeviceService };
