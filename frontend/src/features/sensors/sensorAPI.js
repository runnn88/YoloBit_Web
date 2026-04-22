import { apiGet } from "../../services/api";

export function fetchSensors() {
  return apiGet("/sensors");
}
