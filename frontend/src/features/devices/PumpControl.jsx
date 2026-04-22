export function PumpControl({ enabled, onToggle }) {
  return (
    <section className="pump-control">
      <h3>Pump</h3>
      <button onClick={onToggle} type="button">
        Turn {enabled ? "Off" : "On"}
      </button>
      <p>Status: {enabled ? "Running" : "Stopped"}</p>
    </section>
  );
}
