function createSensorController(sensorService) {
  return {
    list(req, res) {
      res.json(sensorService.listReadings());
    },
  };
}

module.exports = { createSensorController };
