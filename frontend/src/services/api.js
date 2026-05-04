const API_ROOT = import.meta.env.VITE_API_ROOT || "http://localhost:4000";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${API_ROOT}/api`;

async function parseJson(response) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  return parseJson(response);
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseJson(response);
}

export async function fetchBackendHealth() {
  const response = await fetch(`${API_ROOT}/health`);
  return parseJson(response);
}
