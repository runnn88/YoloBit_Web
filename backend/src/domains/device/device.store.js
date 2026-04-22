class DeviceStore {
  constructor() {
    this.state = {};
    this.commands = [];
  }

  updateState(deviceId, nextState) {
    this.state[deviceId] = {
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
