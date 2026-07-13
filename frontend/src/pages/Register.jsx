import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(fields);
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
      <div className="bg-gradient-to-br from-brand-500 to-violet-600 px-7 pb-12 pt-16 text-white">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-3xl">✨</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Create account</h1>
        <p className="mt-1 text-brand-100">It only takes a moment.</p>
      </div>

      <div className="-mt-6 flex-1 overflow-y-auto rounded-t-3xl bg-white px-7 pt-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <input placeholder="Name" value={fields.name} onChange={update("name")} required className={input} />
          <input type="email" placeholder="Email" value={fields.email} onChange={update("email")} required className={input} />
          <input placeholder="Phone (optional)" value={fields.phone} onChange={update("phone")} className={input} />
          <input type="password" placeholder="Password" value={fields.password} onChange={update("password")} required className={input} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-brand-600 py-3.5 font-bold text-white shadow-lg shadow-brand-600/30 transition active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 pb-8 text-center text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-brand-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
