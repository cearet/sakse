import { useState } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";

// Colour-code each notification by kind:
//  red = a charge/penalty, orange = a heads-up, green = good news (default).
function dotColor(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("fee") || t.includes("late")) return "bg-rose-500";
  if (t.includes("almost") || t.includes("cancel")) return "bg-amber-500";
  return "bg-emerald-500";
}

// Bell button with unread badge + a slide-up sheet of notifications.
export default function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread) markAllRead();
  }

  return (
    <>
      <button
        onClick={toggle}
        className="relative grid h-10 w-10 place-items-center rounded-full bg-white/20 active:scale-95"
      >
        <Bell size={18} strokeWidth={2.2} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {/* Portalled to the #root phone frame so it escapes the header's stacking
          context (covering the map, "Nearest to you" card, and navbar) while
          staying inside the mobile frame instead of the whole browser window. */}
      {open &&
        createPortal(
          <div className="absolute inset-0 z-[3000] flex flex-col justify-end" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="animate-pop relative max-h-[70%] overflow-y-auto rounded-t-3xl bg-white p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
              <h2 className="mb-3 text-lg font-bold text-slate-900">Notifications</h2>
              {items.length === 0 ? (
                <p className="py-8 text-center text-slate-400">Nothing yet.</p>
              ) : (
                <div className="space-y-2 pb-4">
                  {items.map((n) => (
                    <div key={n.id} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor(n.title)}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        <p className="text-sm text-slate-500">{n.body}</p>
                        <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.getElementById("root")
        )}
    </>
  );
}
