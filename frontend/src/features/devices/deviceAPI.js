import { apiGet, apiPost } from "../../services/api";

export function fetchDevices() {
  return apiGet("/devices");
}

export function setPump(enabled) {
  return apiPost("/devices/pump", { enabled });
}
