export function formatMetricValue(metric, value) {
  if (metric === "temp") {
    return `${value} C`;
  }

  if (metric === "soil") {
    return `${value}%`;
  }

  return String(value);
}
