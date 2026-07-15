import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WashingMachine } from "lucide-react";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100";

  return (
    <div className="flex h-full flex-col">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 px-7 pb-12 pt-16 text-white">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-white"><WashingMachine size={28} strokeWidth={2} /></div>
        <h1 className="text-3xl font-extrabold tracking-tight">Sakse</h1>
        <p className="mt-1 text-brand-100">Book a washing machine near you.</p>
      </div>

      {/* Form card */}
      <div className="-mt-6 flex-1 rounded-t-3xl bg-white px-7 pt-8">
        <h2 className="mb-6 text-xl font-bold text-slate-900">Welcome back</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={input} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className={input} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-brand-600 py-3.5 font-bold text-white shadow-lg shadow-brand-600/30 transition active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-500">
          New here?{" "}
          <Link to="/register" className="font-bold text-brand-600">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
