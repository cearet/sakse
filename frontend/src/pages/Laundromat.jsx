import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { baht, distance, etaMinutes } from "../format";
import { useGeolocation } from "../hooks/useGeolocation";

const STATUS = {
  AVAILABLE: { label: "Free", cls: "bg-emerald-100 text-emerald-700" },
  RESERVED: { label: "Reserved", cls: "bg-amber-100 text-amber-700" },
  RUNNING: { label: "Running", cls: "bg-brand-100 text-brand-700" },
  DONE: { label: "Done", cls: "bg-violet-100 text-violet-700" },
  OVERDUE: { label: "Overdue", cls: "bg-rose-100 text-rose-700" },
  OUT_OF_ORDER: { label: "Out of order", cls: "bg-slate-200 text-slate-500" },
};

export default function Laundromat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { coords } = useGeolocation();
  const [place, setPlace] = useState(null);
  const [wait, setWait] = useState(null); // this laundromat's active waitlist entry
  const [error, setError] = useState("");

  function load() {
    const q = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : "";
    return api(`/api/laundromats${q}`)
      .then((all) => all.find((p) => p.id === id) || null)
      .catch(() => null);
  }
  function loadWait() {
    return api("/api/waitlist/mine")
      .then((list) => list.find((w) => w.laundromatId === id) || null)
      .catch(() => null);
  }
  useEffect(() => {
    let active = true;
    load().then((p) => active && setPlace(p));
    loadWait().then((w) => active && setWait(w));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, coords]);

  async function joinWaitlist() {
    setError("");
    try {
      await api("/api/waitlist", { method: "POST", body: { laundromatId: id } });
      loadWait().then(setWait);
    } catch (err) {
      setError(err.message);
    }
  }
  async function leaveWaitlist() {
    if (!wait) return;
    await api(`/api/waitlist/${wait.id}/leave`, { method: "POST" }).catch(() => {});
    setWait(null);
  }

  if (!place) return <div className="p-6 text-slate-400">Loading…</div>;

  const freeCount = place.machines.filter((m) => m.status === "AVAILABLE").length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="rounded-b-3xl bg-gradient-to-br from-brand-500 to-violet-600 px-5 pb-8 pt-6 text-white">
        <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-white/80">
          ‹ Back to map
        </Link>
        <h1 className="text-2xl font-extrabold">{place.name}</h1>
        <p className="text-brand-100">{place.address}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
            {freeCount} of {place.machines.length} free
          </span>
          {place.distanceMeters != null && (
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
              {distance(place.distanceMeters)} · ~{etaMinutes(place.distanceMeters)} min
            </span>
          )}
        </div>
        <Link
          to={`/route/${place.id}`}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand-700 shadow active:scale-95"
        >
          🧭 Get directions
        </Link>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-24">
        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}{" "}
            {error.includes("top up") && (
              <Link to="/wallet" className="font-bold underline">
                Go to wallet
              </Link>
            )}
          </p>
        )}

        {/* A machine freed up for this waitlisted user */}
        {wait?.status === "NOTIFIED" && (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            🎉 A machine is free — grab one below before someone else does!
          </div>
        )}

        {/* Waitlist card, shown when everything is busy */}
        {freeCount === 0 &&
          (wait ? (
            <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                You're #{wait.position} in the queue. We'll notify you.
              </p>
              <button onClick={leaveWaitlist} className="text-sm font-bold text-amber-700 underline">
                Leave
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
              <p className="font-semibold text-slate-700">All machines are busy right now</p>
              <button
                onClick={joinWaitlist}
                className="mt-3 w-full rounded-xl bg-brand-600 py-3 font-bold text-white shadow active:scale-95"
              >
                Join the waitlist
              </button>
            </div>
          ))}

        {place.machines.map((m) => {
          const s = STATUS[m.status];
          const free = m.status === "AVAILABLE";
          return (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`grid h-12 w-12 place-items-center rounded-xl text-2xl ${free ? "bg-brand-50" : "bg-slate-50"}`}>
                  🌀
                </div>
                <div>
                  <p className="font-bold text-slate-800">{m.label}</p>
                  <p className="text-xs text-slate-400">
                    {baht(m.pricePerCycle)} · {m.cycleMinutes} min
                  </p>
                  <Link to={`/machine/${m.id}/qr`} className="text-xs font-semibold text-brand-600">
                    ▦ Machine QR
                  </Link>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
                {free && (
                  <button
                    onClick={() => navigate(`/reserve/${m.id}`)}
                    className="rounded-xl bg-brand-600 px-4 py-1.5 text-sm font-bold text-white shadow active:scale-95"
                  >
                    Reserve
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
