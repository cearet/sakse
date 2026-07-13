// Tiny wrapper around fetch that talks to our backend and attaches the
// logged-in user's token automatically.

// Backend base URL. Default is same-origin ("") — the frontend's nginx proxies
// /api/* to the backend, so API calls work over localhost, the LAN IP, and an
// HTTPS tunnel alike with no cross-origin and no rebuild. Set VITE_API_URL only
// to point at a separate backend host.
const BASE = import.meta.env.VITE_API_URL || "";

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
