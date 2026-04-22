function evaluateAutomationRules({ latestSoilReading, deviceService }) {
  if (!latestSoilReading) {
    return null;
  }

  if (latestSoilReading.metric === "soil" && latestSoilReading.value < 30) {
    return deviceService.setPump(true);
  }

  return null;
}

module.exports = { evaluateAutomationRules };
