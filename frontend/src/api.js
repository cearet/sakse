// Tiny wrapper around fetch that talks to our backend and attaches the
// logged-in user's token automatically.

// Where the backend lives. If VITE_API_URL is set at build time it wins;
// otherwise we derive it from whatever host the app was opened on, so it works
// on localhost AND when a phone hits the Mac's LAN IP (e.g. 192.168.1.39:5173
// → backend at 192.168.1.39:4000) with no rebuild.
const BASE =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:4000`;

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
