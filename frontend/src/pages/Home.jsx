import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import { api } from "../api";
import { useAuth } from "../auth";
import { bahtNum, distance, etaMinutes } from "../format";
import { useGeolocation } from "../hooks/useGeolocation";
import BottomNav from "../components/BottomNav";
import NotificationBell from "../components/NotificationBell";

function pinIcon(available) {
  const color = available > 0 ? "#0284c7" : "#94a3b8";
  return L.divIcon({
    className: "",
    html: `<div class="pin" style="background:${color}"><span>${available}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -36],
  });
}

// A pulsing blue dot for the user's own location.
const meIcon = L.divIcon({
  className: "",
  html: `<div class="me-dot"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Recenters the map when the user's location arrives.
function Recenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 13);
  }, [coords, map]);
  return null;
}

// Tracks whether a marker popup is open so we can hide overlapping UI.
function PopupWatcher({ onChange }) {
  useMapEvents({
    popupopen: () => onChange(true),
    popupclose: () => onChange(false),
  });
  return null;
}

export default function Home() {
  const { user, logout } = useAuth();
  const { coords } = useGeolocation();
  const [places, setPlaces] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    // `active` guards against a slower earlier request (no-location) resolving
    // after the newer with-location one and clobbering the distances.
    let active = true;
    const q = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : "";
    api(`/api/laundromats${q}`)
      .then((r) => active && setPlaces(r))
      .catch(() => active && setPlaces([]));
    return () => {
      active = false;
    };
  }, [coords]);

  const center = coords ? [coords.lat, coords.lng] : [13.7455, 100.534];
  const nearest = places[0];

  return (
    <div className="relative flex h-full flex-col">
      <header className="absolute inset-x-0 top-0 z-[1200] flex items-center justify-between gap-3 bg-gradient-to-b from-black/25 to-transparent px-4 pb-8 pt-4 text-white">
        <div>
          <p className="text-xs text-white/80">Hi {user?.name} 👋</p>
          <p className="text-lg font-bold leading-tight">
            <span className="mr-1">฿</span>
            {bahtNum(user?.balance)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={logout} className="rounded-full bg-white/20 px-3 py-2 text-sm font-semibold active:scale-95">
            Log out
          </button>
        </div>
      </header>

      {(user?.balance ?? 0) === 0 && (
        <Link
          to="/wallet"
          className="absolute inset-x-4 top-20 z-[1200] animate-pop rounded-2xl bg-amber-400 px-4 py-3 text-center text-sm font-semibold text-amber-950 shadow-lg"
        >
          Your wallet is empty — tap to top up 💰
        </Link>
      )}

      <MapContainer center={center} zoom={13} zoomControl={false} className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Recenter coords={coords} />
        <PopupWatcher onChange={setPopupOpen} />

        {coords && <Marker position={[coords.lat, coords.lng]} icon={meIcon} />}

        {places.map((place) => {
          const available = place.machines.filter((m) => m.status === "AVAILABLE").length;
          const dist = distance(place.distanceMeters);
          const eta = etaMinutes(place.distanceMeters);
          return (
            <Marker key={place.id} position={[place.lat, place.lng]} icon={pinIcon(available)}>
              <Popup>
                <p className="text-base font-bold text-slate-900">{place.name}</p>
                <p className="text-sm text-slate-500">{place.address}</p>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-bold text-brand-600">{available}</span> of {place.machines.length} free
                  {dist && <span className="text-slate-400"> · {dist}{eta ? ` · ~${eta} min` : ""}</span>}
                </p>
                <div className="mt-2 flex gap-2">
                  <Link
                    to={`/laundromat/${place.id}`}
                    className="inline-block rounded-xl bg-brand-600 px-3 py-2 text-sm font-bold text-white"
                  >
                    Machines →
                  </Link>
                  <Link
                    to={`/route/${place.id}`}
                    className="inline-block rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    🧭 Navigate
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Nearest place card — hidden while a marker popup is open so they don't overlap */}
      {nearest && nearest.distanceMeters != null && !popupOpen && (
        <div className="absolute inset-x-4 bottom-24 z-[1200] animate-pop rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Nearest to you</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900">{nearest.name}</p>
              <p className="text-sm text-slate-500">
                {nearest.machines.filter((m) => m.status === "AVAILABLE").length} free ·{" "}
                {distance(nearest.distanceMeters)} · ~{etaMinutes(nearest.distanceMeters)} min
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                to={`/route/${nearest.id}`}
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-lg"
                title="Navigate"
              >
                🧭
              </Link>
              <Link
                to={`/laundromat/${nearest.id}`}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white"
              >
                Go
              </Link>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
