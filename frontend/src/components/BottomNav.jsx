import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Map", icon: "🗺️" },
  { to: "/reservation", label: "My Wash", icon: "🧺" },
  { to: "/wallet", label: "Wallet", icon: "💰" },
];

// Floating pill-style bottom navigation.
export default function BottomNav() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1500] flex justify-center pb-4">
      <nav className="pointer-events-auto flex gap-1 rounded-full border border-slate-200 bg-white/90 p-1.5 shadow-lg backdrop-blur">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive ? "bg-brand-600 text-white shadow" : "text-slate-500"
              }`
            }
          >
            <span>{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
