import { fetchSensors } from "./sensorAPI";

export async function loadSensors(setState) {
  const sensors = await fetchSensors();
  setState(sensors);
}
