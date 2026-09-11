"use client";

import { useEffect, useState } from "react";
import { createReply, deleteReply, getCurrentUserId, getReplies, Reply, updateReply } from "../../lib/api";

type ReplySectionProps = { postId: number };

export default function ReplySection({ postId }: ReplySectionProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const currentUserId = getCurrentUserId();

  const loadReplies = async () => {
    setLoading(true);
    try {
      setReplies(await getReplies(postId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load replies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReplies(); }, [postId]);

  const submit = async () => {
    const trimmed = content.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError("");
    try {
      const reply = editingId === null
        ? await createReply(postId, trimmed)
        : await updateReply(editingId, trimmed);
      setReplies((current) => editingId === null ? [...current, reply] : current.map((item) => item.id === reply.id ? reply : item));
      setContent("");
      setEditingId(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save reply.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (replyId: number) => {
    try {
      await deleteReply(replyId);
      setReplies((current) => current.filter((item) => item.id !== replyId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete reply.");
    }
  };

  return <section className="mt-4 border-t border-white/10 pt-4" aria-label="Replies">
    {loading ? <p className="text-sm text-slate-500">Loading replies...</p> : <div className="space-y-3">
      {replies.map((reply) => <div key={reply.id} className="rounded-md bg-white/[0.03] p-3 text-sm">
        <p className="text-slate-300">{reply.content}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500"><span>{reply.owner?.username ?? "User"}</span>{reply.owner_id === currentUserId ? <><button type="button" onClick={() => { setEditingId(reply.id); setContent(reply.content); }}>Edit</button><button type="button" onClick={() => void remove(reply.id)}>Delete</button></> : null}</div>
      </div>)}
      {!replies.length ? <p className="text-sm text-slate-500">No replies yet.</p> : null}
    </div>}
    <div className="mt-3 flex gap-2"><input value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submit(); }} placeholder={editingId === null ? "Write a reply..." : "Edit your reply..."} aria-label="Reply content" className="min-w-0 flex-1 rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus-visible" /><button type="button" onClick={() => void submit()} disabled={saving || !content.trim()} className="vf-btn-primary px-3 py-2 text-sm">{saving ? "Saving..." : editingId === null ? "Reply" : "Save"}</button></div>
    {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
  </section>;
}