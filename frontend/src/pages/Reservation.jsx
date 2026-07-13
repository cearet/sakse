import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { baht, machineCode } from "../format";
import BottomNav from "../components/BottomNav";
import NotificationBell from "../components/NotificationBell";
import QrScanner from "../components/QrScanner";

function fmt(ms) {
  if (ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Animated circular progress ring.
function Ring({ progress, children, color }) {
  const r = 100;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-60 w-60">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        <circle
          cx="110"
          cy="110"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export default function Reservation() {
  const { refreshUser } = useAuth();
  const [reservation, setReservation] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [scan, setScan] = useState(null); // "start" | "collect" | null

  function load() {
    api("/api/reservations/mine").then(setReservation).catch(() => setReservation(null));
  }
  useEffect(load, []);

  // Tick every second; also re-fetch periodically so worker-driven status
  // changes (DONE / OVERDUE / fine) show up.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(load, 4000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, []);

  async function act(path, body) {
    setBusy(true);
    try {
      await api(path, { method: "POST", body });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!reservation) return;
    if (!confirm("Cancel this reservation? You'll be refunded in full.")) return;
    setBusy(true);
    try {
      await api(`/api/reservations/${reservation.id}/cancel`, { method: "POST" });
      await refreshUser();
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Called after the scanner reads the machine's QR sticker.
  function onScanned(code) {
    const mode = scan;
    setScan(null);
    if (mode === "start") act(`/api/reservations/${reservation.id}/start`, { code });
    else if (mode === "collect") act(`/api/reservations/${reservation.id}/collect`, { code });
  }

  const machine = reservation?.machine;
  const status = machine?.status;
  const startMs = reservation?.startedAt ? new Date(reservation.startedAt).getTime() : 0;
  const doneMs = reservation?.doneAt ? new Date(reservation.doneAt).getTime() : 0;
  const remaining = doneMs - now;
  const total = doneMs - startMs;
  const progress = total > 0 ? Math.min(Math.max((now - startMs) / total, 0), 1) : 0;
  const finished = (status === "RUNNING" && remaining <= 0) || status === "DONE" || status === "OVERDUE";

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <header className="flex items-center justify-between rounded-b-3xl bg-gradient-to-br from-brand-500 to-violet-600 px-5 pb-8 pt-6 text-white">
        <h1 className="text-2xl font-extrabold">My Wash</h1>
        <NotificationBell />
      </header>

      <div className="flex-1 overflow-y-auto p-5 pb-24">
        {reservation === undefined && <p className="text-slate-400">Loading…</p>}

        {reservation === null && (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-white text-5xl shadow-sm">🧺</div>
            <p className="text-slate-500">No active wash right now.</p>
            <Link to="/" className="mt-5 inline-block rounded-2xl bg-brand-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/30">
              Find a machine
            </Link>
          </div>
        )}

        {reservation && machine && (
          <div className="animate-pop rounded-3xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-400">{machine.laundromat?.name}</p>
            <p className="text-xl font-extrabold text-slate-900">{machine.label}</p>

            {/* RESERVED — waiting to start */}
            {status === "RESERVED" && (
              <div className="mt-6">
                <div className="mx-auto mb-5 grid h-40 w-40 place-items-center rounded-full bg-amber-50 text-6xl">🧺</div>
                <p className="font-semibold text-slate-700">Reserved &amp; paid</p>
                <p className="mt-1 text-sm text-slate-500">Load your clothes, then scan the machine's QR to start.</p>
                {reservation.expiresAt && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                    <span>⏳ Auto-cancels in</span>
                    <span className="tabular-nums font-bold">
                      {fmt(new Date(reservation.expiresAt).getTime() - now)}
                    </span>
                  </div>
                )}
                <button
                  disabled={busy}
                  onClick={() => setScan("start")}
                  className="mt-6 w-full rounded-2xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/30 active:scale-[0.99] disabled:opacity-60"
                >
                  📷 Scan QR to start
                </button>
                <button
                  disabled={busy}
                  onClick={cancel}
                  className="mt-3 w-full rounded-2xl bg-rose-500 py-3 font-semibold text-white shadow-lg shadow-rose-500/30 active:scale-[0.99] disabled:opacity-60"
                >
                  Cancel &amp; refund
                </button>
              </div>
            )}

            {/* RUNNING / DONE / OVERDUE — the ring */}
            {(status === "RUNNING" || status === "DONE" || status === "OVERDUE") && (
              <div className="mt-6">
                <Ring
                  progress={finished ? 1 : progress}
                  color={status === "OVERDUE" ? "#e11d48" : finished ? "#7c3aed" : "#4f46e5"}
                >
                  {finished ? (
                    <>
                      <span className="text-5xl">{status === "OVERDUE" ? "⏰" : "✅"}</span>
                      <span className="mt-1 font-bold text-slate-700">
                        {status === "OVERDUE" ? "Overdue!" : "Done!"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-5xl font-extrabold tabular-nums text-slate-900">{fmt(remaining)}</span>
                      <span className="mt-1 text-sm text-slate-400">remaining</span>
                    </>
                  )}
                </Ring>

                {reservation.fineAmount > 0 && (
                  <p className="mt-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                    Late fee charged: {baht(reservation.fineAmount)}
                  </p>
                )}

                {finished ? (
                  <button
                    disabled={busy}
                    onClick={() => setScan("collect")}
                    className="mt-6 w-full rounded-2xl bg-brand-600 py-3.5 font-bold text-white shadow-lg shadow-brand-600/30 active:scale-[0.99] disabled:opacity-60"
                  >
                    📷 Scan QR to collect
                  </button>
                ) : (
                  <div className="mt-6 w-full rounded-2xl bg-slate-100 py-3.5 text-center font-semibold text-slate-400">
                    🔒 Collect unlocks when the timer ends
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {scan && machine && (
        <QrScanner
          expect={machineCode(machine.id)}
          title={scan === "start" ? "Scan to start your wash" : "Scan to collect"}
          hint={`Point at the QR sticker on ${machine.label}.`}
          onSuccess={onScanned}
          onClose={() => setScan(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
