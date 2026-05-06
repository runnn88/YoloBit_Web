class DeviceStore {
  constructor() {
    this.state = {
      "pump-001": {
        deviceId: "pump-001",
        connected: false,
        desiredEnabled: false,
        reportedEnabled: false,
        wateringMode: "manual",
        status: "offline",
        updatedAt: new Date().toISOString(),
      },
      "pump-002": {
        deviceId: "pump-002",
        connected: false,
        desiredEnabled: false,
        reportedEnabled: false,
        wateringMode: "manual",
        status: "offline",
        updatedAt: new Date().toISOString(),
      },
      "yolobit-001": {
        deviceId: "yolobit-001",
        connected: false,
        transport: "usb-serial",
        serialPath: "",
        baudRate: null,
        desiredLeafState: null,
        reportedLeafState: null,
        lastCommand: null,
        lastSerialMessage: "",
        lastSensorReadAt: null,
        sensorError: "",
        status: "serial_disconnected",
        updatedAt: new Date().toISOString(),
      },
    };
    this.commands = [];
  }

  updateState(deviceId, nextState) {
    this.state[deviceId] = {
      deviceId,
      ...(this.state[deviceId] || {}),
      ...nextState,
      updatedAt: new Date().toISOString(),
    };
    return this.state[deviceId];
  }

  getState() {
    return this.state;
  }

  addCommand(command) {
    this.commands.unshift(command);
    this.commands = this.commands.slice(0, 50);
    return command;
  }
}

module.exports = { DeviceStore };
