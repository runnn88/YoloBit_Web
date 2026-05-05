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

export function setPump(enabled) {
  return apiPost("/devices/pump", { enabled });
}

export function setWateringMode(mode) {
  return apiPost("/devices/watering-mode", { mode });
}
