const express = require("express");
const { createSensorController } = require("../domains/sensor/sensor.controller");
const { createDeviceController } = require("../domains/device/device.controller");

module.exports = function routes({ sensorService, deviceService }) {
  const router = express.Router();
  const sensorController = createSensorController(sensorService);
  const deviceController = createDeviceController(deviceService);

  router.get("/sensors", sensorController.list);
  router.get("/devices", deviceController.list);
  router.post("/devices/pump", deviceController.setPump);

  return router;
};
