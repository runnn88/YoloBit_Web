export function SensorCard({ title, value, unit }) {
  return (
    <article className="sensor-card">
      <h3>{title}</h3>
      <p>
        <strong>{value}</strong> {unit}
      </p>
    </article>
  );
}
