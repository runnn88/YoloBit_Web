function createDeviceController(deviceService) {
  return {
    list(req, res) {
      res.json(deviceService.listState());
    },
    setPump(req, res) {
      const result = deviceService.setPump(Boolean(req.body.enabled));
      res.json(result);
    },
  };
}

module.exports = { createDeviceController };
