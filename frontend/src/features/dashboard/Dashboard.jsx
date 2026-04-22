import { useEffect, useState } from "react";
import { PumpControl } from "../devices/PumpControl";
import { fetchDevices, setPump } from "../devices/deviceAPI";
import { SensorCard } from "../sensors/SensorCard";
import { loadSensors } from "../sensors/sensorSlice";

export function Dashboard() {
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState({});

  useEffect(() => {
    loadSensors(setSensors);
    fetchDevices().then(setDevices);
  }, []);

  async function handlePumpToggle() {
    const current = Boolean(devices["pump-001"]?.enabled);
    const nextState = await setPump(!current);
    setDevices((prev) => ({
      ...prev,
      "pump-001": nextState,
    }));
  }

  return (
    <main className="dashboard">
      <section className="sensor-grid">
        {sensors.map((sensor) => (
          <SensorCard
            key={`${sensor.deviceId}-${sensor.metric}`}
            title={sensor.metric.toUpperCase()}
            value={sensor.value}
            unit={sensor.metric === "temp" ? "C" : "%"}
          />
        ))}
      </section>

      <PumpControl
        enabled={Boolean(devices["pump-001"]?.enabled)}
        onToggle={handlePumpToggle}
      />
    </main>
  );
}
