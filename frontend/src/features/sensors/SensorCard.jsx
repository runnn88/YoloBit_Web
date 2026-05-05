import React from "react";

export function SensorCard({ title, value, unit, tone = "neutral", eyebrow }) {
  return (
    <article className={`sensor-card sensor-card-${tone}`}>
      {eyebrow ? <p className="sensor-eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <p className="sensor-value">
        <strong>{value}</strong>
        {unit ? <span>{unit}</span> : null}
      </p>
    </article>
  );
}
