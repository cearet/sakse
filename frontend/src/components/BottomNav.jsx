import { NavLink } from "react-router-dom";
import { Map, WashingMachine, Wallet } from "lucide-react";

const tabs = [
  { to: "/", label: "Map", Icon: Map },
  { to: "/reservation", label: "My Wash", Icon: WashingMachine },
  { to: "/wallet", label: "Wallet", Icon: Wallet },
];

// Floating pill-style bottom navigation.
export default function BottomNav() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1500] flex justify-center pb-4">
      <nav className="pointer-events-auto flex gap-1 rounded-full border border-slate-200 bg-white/90 p-1.5 shadow-lg backdrop-blur">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive ? "bg-brand-600 text-white shadow" : "text-slate-500"
              }`
            }
          >
            <Icon size={17} strokeWidth={2.2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
