import { api } from "../api";

// Fetch a driving route between two {lat, lng} points. Our backend proxies
// OSRM (free OpenStreetMap routing) and returns { distance, duration,
// coordinates, steps } — so the browser never depends on a third-party host.
export async function fetchRoute(from, to) {
  return api(
    `/api/route?fromLat=${from.lat}&fromLng=${from.lng}&toLat=${to.lat}&toLng=${to.lng}`
  );
}
