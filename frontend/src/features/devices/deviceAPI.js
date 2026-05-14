import { apiGet, apiPost } from "../../services/api";

export function fetchDevices() {
  return apiGet("/devices");
}

export function fetchYoloBitPorts() {
  return apiGet("/devices/ports");
}

export function connectYoloBit(payload) {
  return apiPost("/devices/yolobit/connect", payload);
}

export function disconnectYoloBit() {
  return apiPost("/devices/yolobit/disconnect", {});
}

export function refreshYoloBitSensors() {
  return apiPost("/devices/yolobit/refresh", {});
}

<<<<<<< Updated upstream
export function setPump(enabled) {
  return apiPost("/devices/pump", { enabled });
=======
export function fetchSoilThresholds() {
  return apiGet("/devices/thresholds");
}

export function setSoilThresholds(thresholds) {
  return apiPost("/devices/thresholds", thresholds);
>>>>>>> Stashed changes
}

export function setPump1(enabled) {
  return apiPost("/devices/pump1", { enabled });
}

export function setPump2(enabled) {
  return apiPost("/devices/pump2", { enabled });
}

export function setWateringMode(mode) {
  return apiPost("/devices/watering-mode", { mode });
}
