import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { baht, bahtNum } from "../format";
import BottomNav from "../components/BottomNav";

const TOPUP_OPTIONS = [5000, 10000, 20000]; // ฿50, ฿100, ฿200

const TXN_ICON = { TOPUP: "⬆️", PAYMENT: "🌀", FINE: "⏰", REFUND: "↩️" };

export default function Wallet() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);

  function load() {
    api("/api/wallet").then(setWallet).catch(() => setWallet(null));
  }
  useEffect(load, []);

  // Go to the confirmation page — payment is finalised there.
  function topup(amount) {
    navigate(`/wallet/topup?amount=${amount}`);
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <header className="rounded-b-3xl bg-gradient-to-br from-brand-500 to-brand-600 px-5 pb-8 pt-6 text-white">
        <h1 className="text-2xl font-extrabold">Wallet</h1>
        <p className="mt-6 text-sm text-brand-100">Balance</p>
        <p className="text-4xl font-extrabold">
          <span className="mr-2 font-bold">฿</span>
          {bahtNum(user?.balance)}
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-24">
        {/* Top-up */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-3 font-bold text-slate-800">Top up</p>
          <div className="grid grid-cols-3 gap-3">
            {TOPUP_OPTIONS.map((amt) => (
              <button
                key={amt}
                onClick={() => topup(amt)}
                className="rounded-2xl border-2 border-brand-100 bg-brand-50 py-4 font-extrabold text-brand-700 transition active:scale-95"
              >
                {baht(amt)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            🇹🇭 Opens a PromptPay QR to confirm before the balance is added.
          </p>
        </div>

        {/* History */}
        <div>
          <p className="mb-2 font-bold text-slate-800">Recent activity</p>
          <div className="space-y-2">
            {wallet?.transactions?.length ? (
              wallet.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-lg">
                      {TXN_ICON[t.type] || "•"}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">{t.note || t.type}</p>
                      <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${t.amount >= 0 ? "text-emerald-600" : "text-slate-800"}`}>
                    {t.amount >= 0 ? "+" : ""}
                    {baht(t.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No transactions yet.</p>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
