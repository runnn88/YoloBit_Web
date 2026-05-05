const config = require("./config");
const eventBus = require("./core/eventBus");
const { createSerialGateway } = require("./core/serial");
const { createServer } = require("./core/server");
const { SensorStore } = require("./domains/sensor/sensor.store");
const { SensorService } = require("./domains/sensor/sensor.service");
const { DeviceStore } = require("./domains/device/device.store");
const { DeviceService } = require("./domains/device/device.service");

const sensorStore = new SensorStore();
const deviceStore = new DeviceStore();

const sensorService = new SensorService({ store: sensorStore, eventBus });

const deviceService = new DeviceService({
  store: deviceStore,
  eventBus,
  sensorService,
  serialGateway: {
    connect() {
      throw new Error("Serial gateway not initialized yet.");
    },
  },
  config,
});

const serialGateway = createSerialGateway({
  onConnected(connection) {
    deviceService.markSerialConnected(connection);
  },
  onDisconnected() {
    deviceService.markSerialDisconnected();
  },
  onData(line) {
    deviceService.handleSerialData(line);
  },
  onError(error) {
    deviceService.handleSerialError(error);
  },
});

deviceService.serialGateway = serialGateway;

const app = createServer({ sensorService, deviceService });

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});
