import { useCallback, useEffect, useState } from "react";
import { api, getToken } from "../api";

// Polls the notifications endpoint so the bell + banners stay fresh.
export function useNotifications(intervalMs = 4000) {
  const [items, setItems] = useState([]);

  const refresh = useCallback(() => {
    if (!getToken()) return;
    api("/api/notifications").then(setItems).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, intervalMs);
    return () => clearInterval(t);
  }, [refresh, intervalMs]);

  const markAllRead = useCallback(async () => {
    await api("/api/notifications/read", { method: "POST" }).catch(() => {});
    refresh();
  }, [refresh]);

  const unread = items.filter((n) => !n.read).length;
  return { items, unread, refresh, markAllRead };
}
