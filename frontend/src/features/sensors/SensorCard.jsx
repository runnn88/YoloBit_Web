import React from "react";

export function SensorCard({ title, value, unit, tone = "neutral", eyebrow, children }) {
  return (
    <article className={`sensor-card sensor-card-${tone}`}>
      {eyebrow ? <p className="sensor-eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <p className="sensor-value">
        <h2>{value}</h2>
        {unit ? <span>{unit}</span> : null}
      </p>
      {children}
    </article>
  );
}
