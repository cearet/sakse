import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { api } from "../api";
import { useGeolocation } from "../hooks/useGeolocation";
import { fetchRoute } from "../lib/routing";
import { distance } from "../format";

const meIcon = L.divIcon({ className: "", html: `<div class="me-dot"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] });
const destIcon = L.divIcon({
  className: "",
  html: `<div class="pin" style="background:#4f46e5"><span>📍</span></div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

// Zoom the map to fit the whole route.
function FitRoute({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates?.length) map.fitBounds(coordinates, { padding: [40, 40] });
  }, [coordinates, map]);
  return null;
}

export default function Directions() {
  const { id } = useParams();
  const { coords, error: geoError } = useGeolocation();
  const [place, setPlace] = useState(null);
  const [route, setRoute] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/laundromats")
      .then((all) => setPlace(all.find((p) => p.id === id) || null))
      .catch(() => setPlace(null));
  }, [id]);

  useEffect(() => {
    if (!coords || !place) return;
    let active = true;
    setError("");
    fetchRoute(coords, { lat: place.lat, lng: place.lng })
      .then((r) => active && setRoute(r))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [coords, place]);

  if (!place) return <div className="p-6 text-slate-400">Loading…</div>;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <Link to={`/laundromat/${id}`} className="text-xl text-brand-600">‹</Link>
        <div>
          <h1 className="font-bold leading-none text-slate-900">Directions</h1>
          <p className="text-xs text-slate-400">to {place.name}</p>
        </div>
      </header>

      {/* Map with the route drawn on it */}
      <div className="h-64 shrink-0">
        <MapContainer center={[place.lat, place.lng]} zoom={14} zoomControl={false} className="h-full w-full">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OSM &copy; CARTO" />
          {coords && <Marker position={[coords.lat, coords.lng]} icon={meIcon} />}
          <Marker position={[place.lat, place.lng]} icon={destIcon} />
          {route && (
            <>
              <Polyline positions={route.coordinates} pathOptions={{ color: "#4f46e5", weight: 5, opacity: 0.85 }} />
              <FitRoute coordinates={route.coordinates} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Summary + steps */}
      <div className="flex-1 overflow-y-auto">
        {geoError && <p className="p-5 text-sm text-rose-600">Location needed for directions: {geoError}</p>}
        {error && <p className="p-5 text-sm text-rose-600">{error}</p>}
        {!route && !error && !geoError && <p className="p-5 text-slate-400">Finding the best route…</p>}

        {route && (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{Math.max(1, Math.round(route.duration / 60))} min</p>
                <p className="text-sm text-slate-400">{distance(route.distance)} · driving</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700">🚗 Fastest</span>
            </div>
            <ol className="divide-y divide-slate-100 pb-6">
              {route.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 bg-white px-5 py-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-slate-800">{s.text}</p>
                    {s.distance > 0 && <p className="text-xs text-slate-400">{distance(s.distance)}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
