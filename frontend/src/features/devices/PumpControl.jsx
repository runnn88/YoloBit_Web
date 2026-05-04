import React from "react";

export function PumpControl({ device, onToggle }) {
  const desiredEnabled = Boolean(device?.desiredEnabled);
  const reportedEnabled = Boolean(device?.reportedEnabled);
  const connected = Boolean(device?.connected);

  let statusText = "Offline";

  if (connected) {
    statusText = reportedEnabled ? "Running" : "Stopped";
  } else if (device?.status === "command_sent_unconfirmed") {
    statusText = `Command sent: ${desiredEnabled ? "ON" : "OFF"} (unconfirmed)`;
  }

  return (
    <section className="pump-control">
      <h3>Pump</h3>
      <button onClick={onToggle} type="button">
        Turn {desiredEnabled ? "Off" : "On"}
      </button>
      <p>Status: {statusText}</p>
    </section>
  );
}
