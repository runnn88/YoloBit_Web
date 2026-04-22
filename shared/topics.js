const TOPICS = {
  sensors: {
    tempValue: "farm/sensor/temp/value",
    soilValue: "farm/sensor/soil/value",
  },
  controls: {
    pumpSet: "farm/control/pump/set",
    lightSet: "farm/control/light/set",
  },
  state: {
    pumpStatus: "farm/state/pump/status",
    lightStatus: "farm/state/light/status",
  },
};

module.exports = { TOPICS };
