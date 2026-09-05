"use client";

import { useEffect, useState } from "react";
import { getFollowers, getFollowing, getProfileFollowers, getProfileFollowing, UserOut } from "../../lib/api";
import Avatar from "./Avatar";
import { Empty, ErrorBanner, Loading } from "./Feedback";

type ConnectionKind = "followers" | "following";

export default function ProfileConnections({ userId, username, kind, onClose }: { userId?: number; username?: string; kind: ConnectionKind; onClose: () => void }) {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const load = username
      ? (kind === "followers" ? getProfileFollowers(username, { limit: 20, skip: 0 }) : getProfileFollowing(username, { limit: 20, skip: 0 }))
      : (kind === "followers" ? getFollowers(userId as number, { limit: 20, skip: 0 }) : getFollowing(userId as number, { limit: 20, skip: 0 }));
    void load.then(setUsers).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load connections.")).finally(() => setLoading(false));
  }, [kind, userId, username]);
  return <div className="profile-dialog-backdrop" role="presentation" onClick={onClose}><section className="profile-dialog vf-card" role="dialog" aria-modal="true" aria-labelledby="connections-title" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-white/10 p-5"><h2 id="connections-title" className="text-lg font-semibold">{kind === "followers" ? "Followers" : "Following"}</h2><button className="vf-icon-button" onClick={onClose} aria-label="Close connections">×</button></div><div className="max-h-[60vh] overflow-y-auto p-3">{loading ? <Loading label="Loading people..." /> : error ? <ErrorBanner message={error} /> : users.length === 0 ? <Empty title={`No ${kind} yet`} /> : <div className="space-y-1">{users.map((person) => <div key={person.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-white/5"><Avatar email={person.email} id={person.id} size={40} /><div className="min-w-0"><p className="truncate font-medium">{person.display_name || person.email.split("@")[0]}</p><p className="truncate text-xs text-slate-500">@{person.username || person.email.split("@")[0]}</p></div></div>)}</div>}</div></section></div>;
}