import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { baht } from "../format";
import Qr from "../components/Qr";

export default function TopupConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const amount = Number(params.get("amount")) || 0;
  // Demo placeholder — a real integration would render an EMVCo PromptPay QR here.
  const payload = "https://google.com";

  if (amount <= 0) {
    return (
      <div className="grid h-full place-items-center bg-slate-50 p-8 text-center text-slate-500">
        <div>
          <p>Nothing to pay.</p>
          <Link to="/wallet" className="mt-3 inline-block font-bold text-brand-600">
            Back to wallet
          </Link>
        </div>
      </div>
    );
  }

  async function confirm() {
    setBusy(true);
    try {
      await api("/api/wallet/topup", { method: "POST", body: { amount } });
      await refreshUser();
      setDone(true);
      setTimeout(() => navigate("/wallet", { replace: true }), 1100);
    } catch (err) {
      alert(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <header className="rounded-b-3xl bg-gradient-to-br from-brand-500 to-brand-600 px-5 pb-8 pt-6 text-white">
        <Link to="/wallet" className="mb-3 inline-flex items-center gap-1 text-sm text-white/80">
          ‹ Cancel
        </Link>
        <h1 className="text-2xl font-extrabold">Confirm top-up</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {done ? (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-5xl">✅</div>
            <p className="text-lg font-bold text-slate-800">Payment received</p>
            <p className="text-sm text-slate-500">{baht(amount)} added to your wallet</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-400">Amount</p>
            <p className="text-4xl font-extrabold text-slate-900">
              <span className="mr-2 font-bold">฿</span>
              {(amount / 100).toFixed(2)}
            </p>

            <div className="my-6 flex justify-center">
              <Qr text={payload} size={200} />
            </div>

            <p className="text-sm font-semibold text-slate-700">Scan with your banking app</p>
            <p className="mt-1 text-xs text-slate-400">Demo placeholder · https://google.com</p>
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Demo: this QR is simulated. Tap below to confirm the payment.
            </p>

            <button
              disabled={busy}
              onClick={confirm}
              className="mt-5 w-full rounded-2xl bg-brand-600 py-3.5 font-bold text-white shadow-lg shadow-brand-600/30 active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? "Confirming…" : `I've paid ${baht(amount)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
