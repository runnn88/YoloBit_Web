import React from "react";

export function PumpControl({ device, onToggle, disabled = false, title = "Pump Control", hint = "" }) {
  const desiredEnabled = Boolean(device?.desiredEnabled);
  const reportedEnabled = Boolean(device?.reportedEnabled);
  const connected = Boolean(device?.connected);

  let statusText = "Offline";
  if (connected) {
    statusText = reportedEnabled ? "Running" : "Standing by";
  }

  return (
    <section className="panel-card pump-panel">
      <div className="panel-head">
        <div>
          <p className="panel-kicker">Manual Override</p>
          <h3>{title}</h3>
        </div>
        <span className={reportedEnabled ? "mode-pill live" : "mode-pill idle"}>{statusText}</span>
      </div>

      <div className="pump-switch-row">
        <button
          className={desiredEnabled ? "switch-button active" : "switch-button"}
          disabled={disabled || !connected}
          onClick={onToggle}
          type="button"
        >
          <span className="switch-thumb" />
        </button>
        <div>
          <p className="pump-label">{disabled && connected ? "Please wait" : desiredEnabled ? "Turn Off" : "Turn On"}</p>
          <p className="pump-copy">{hint || "Use this only when the board is connected."}</p>
        </div>
      </div>
    </section>
  );
}
