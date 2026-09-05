"use client";

import { useEffect, useState } from "react";
import { followUser, getFollowStatus, unfollowUser } from "../../lib/api";

export default function FollowButton({ userId }: { userId: number }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void getFollowStatus(userId).then((status) => setFollowing(status.following)).catch(() => setError("Unable to load follow status.")).finally(() => setBusy(false)); }, [userId]);
  const toggle = async () => { if (busy) return; const previous = following; setFollowing(!previous); setBusy(true); setError(""); try { if (previous) await unfollowUser(userId); else await followUser(userId); } catch (actionError) { setFollowing(previous); setError(actionError instanceof Error ? actionError.message : "Unable to update follow status."); } finally { setBusy(false); } };
  return <div><button className={following ? "vf-btn-secondary" : "vf-btn-primary"} onClick={() => void toggle()} disabled={busy}>{busy ? "Loading..." : following ? "Following" : "Follow"}</button>{error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}</div>;
}