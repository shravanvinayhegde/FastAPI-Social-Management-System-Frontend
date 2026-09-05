"use client";

import { useEffect, useState } from "react";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, Notification } from "../../lib/api";
import { Empty, ErrorBanner, Loading } from "../components/Feedback";

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void Promise.all([getNotifications({ limit: 50 }), getUnreadNotificationCount()]).then(([nextItems, count]) => { setItems(nextItems); setUnread(count); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.")).finally(() => setLoading(false)); }, []);
  const read = async (id: number) => { await markNotificationRead(id); setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item)); setUnread((count) => Math.max(0, count - 1)); };
  const readAll = async () => { await markAllNotificationsRead(); setItems((current) => current.map((item) => ({ ...item, is_read: true }))); setUnread(0); };
  return <div className="mx-auto max-w-3xl space-y-6"><section className="vf-page-heading"><div><p className="vf-eyebrow">Your activity</p><h1>Notifications</h1><p>{unread ? `${unread} unread updates` : "You are all caught up."}</p></div><button className="vf-btn-secondary px-4" onClick={() => void readAll()} disabled={!unread}>Mark all read</button></section>{error ? <ErrorBanner message={error} /> : null}{loading ? <Loading label="Loading notifications..." /> : items.length === 0 ? <Empty title="No notifications" message="New activity will appear here." /> : <div className="space-y-2">{items.map((item) => { let payload: Record<string, unknown> = {}; try { payload = JSON.parse(item.payload) as Record<string, unknown>; } catch { /* keep generic notification text */ } return <button key={item.id} onClick={() => !item.is_read && void read(item.id)} className={`vf-card w-full p-4 text-left ${item.is_read ? "opacity-70" : "border-l-2 border-[hsl(var(--accent))]"}`}><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{item.type.replace(/_/g, " ")}</p><p className="mt-1 text-sm text-slate-400">{typeof payload.message === "string" ? payload.message : "There is new activity waiting for you."}</p></div><time className="shrink-0 text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</time></div></button>; })}</div>}</div>;
}