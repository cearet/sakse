import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { baht } from "../format";

export default function ReserveConfirm() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [ctx, setCtx] = useState(undefined); // { place, machine } | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/api/laundromats")
      .then((all) => {
        if (!active) return;
        for (const p of all) {
          const m = p.machines.find((x) => x.id === machineId);
          if (m) return setCtx({ place: p, machine: m });
        }
        setCtx(null);
      })
      .catch(() => active && setCtx(null));
    return () => {
      active = false;
    };
  }, [machineId]);

  if (ctx === undefined) return <div className="p-6 text-slate-400">Loading…</div>;
  if (ctx === null)
    return (
      <div className="grid h-full place-items-center bg-slate-50 p-8 text-center text-slate-500">
        <div>
          <p>Machine not found.</p>
          <Link to="/" className="mt-3 inline-block font-bold text-brand-600">Back to map</Link>
        </div>
      </div>
    );

  const { place, machine } = ctx;
  const price = machine.pricePerCycle;
  const balance = user?.balance ?? 0;
  const short = balance < price;

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await api("/api/reservations", { method: "POST", body: { machineId } });
      await refreshUser();
      navigate("/reservation", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <header className="rounded-b-3xl bg-gradient-to-br from-brand-500 to-brand-600 px-5 pb-8 pt-6 text-white">
        <Link to={`/laundromat/${place.id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-white/80">
          ‹ Cancel
        </Link>
        <h1 className="text-2xl font-extrabold">Confirm reservation</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-2xl">🌀</div>
            <div>
              <p className="font-bold text-slate-800">{machine.label}</p>
              <p className="text-xs text-slate-400">{place.name}</p>
            </div>
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Cycle</dt>
              <dd className="font-semibold text-slate-800">{machine.cycleMinutes} min</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Price</dt>
              <dd className="font-semibold text-slate-800">{baht(price)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2">
              <dt className="text-slate-500">Wallet balance</dt>
              <dd className="font-semibold text-slate-800">{baht(balance)}</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {baht(price)} will be paid from your wallet now. You can cancel for a full refund
            any time before you start the wash.
          </p>

          {error && (
            <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}{" "}
              {(short || /top up|balance/i.test(error)) && (
                <Link to="/wallet" className="font-bold underline">Top up</Link>
              )}
            </p>
          )}

          {short ? (
            <Link
              to="/wallet"
              className="mt-5 block w-full rounded-2xl bg-amber-400 py-3.5 text-center font-bold text-amber-950 shadow-lg active:scale-[0.99]"
            >
              Not enough balance — top up
            </Link>
          ) : (
            <button
              disabled={busy}
              onClick={confirm}
              className="mt-5 w-full rounded-2xl bg-brand-600 py-3.5 font-bold text-white shadow-lg shadow-brand-600/30 active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? "Reserving…" : `Confirm & pay ${baht(price)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
