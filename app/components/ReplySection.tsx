"use client";

import { useEffect, useState } from "react";
import { createReply, deleteReply, getCurrentUserId, getReplies, Reply, updateReply } from "../../lib/api";
import Avatar from "./Avatar";

type ReplySectionProps = { postId: number };

export default function ReplySection({ postId }: ReplySectionProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<number | null>(null);
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
        ? await createReply(postId, trimmed, replyTarget)
        : await updateReply(editingId, trimmed);
      setReplies((current) => editingId === null ? [...current, reply] : current.map((item) => item.id === reply.id ? reply : item));
      setContent("");
      setEditingId(null);
      setReplyTarget(null);
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

  const renderReply = (reply: Reply, depth = 0) => <div key={reply.id} className={`rounded-md bg-white/[0.03] p-3 text-sm ${depth ? "ml-5 border-l border-white/10" : ""}`}>
    <div className="flex items-start gap-3"><Avatar id={reply.owner_id} email={reply.owner?.email} avatarUrl={reply.owner?.avatar_url} size={32} /><div className="min-w-0 flex-1"><p className="font-semibold text-slate-200">{reply.owner?.display_name || reply.owner?.username || "User"} <span className="font-normal text-slate-500">@{reply.owner?.username || "user"}</span></p><p className="mt-1 text-slate-300">{reply.content}</p><div className="mt-2 flex items-center gap-3 text-xs text-slate-500"><time>{new Date(reply.created_at).toLocaleDateString()}</time><button type="button" onClick={() => { setReplyTarget(reply.id); setEditingId(null); setContent(""); }}>Reply</button>{reply.owner_id === currentUserId ? <><button type="button" onClick={() => { setEditingId(reply.id); setContent(reply.content); setReplyTarget(null); }}>Edit</button><button type="button" onClick={() => void remove(reply.id)}>Delete</button></> : null}</div></div></div>
    {replies.filter((child) => child.parent_id === reply.id).map((child) => renderReply(child, depth + 1))}
  </div>;

  return <section className="mt-4 border-t border-white/10 pt-4" aria-label="Replies">
    {loading ? <p className="text-sm text-slate-500">Loading replies...</p> : <div className="space-y-3">
      {replies.filter((reply) => reply.parent_id === null).map((reply) => renderReply(reply))}
      {!replies.length ? <p className="text-sm text-slate-500">No replies yet.</p> : null}
    </div>}
    <div className="mt-3 rounded-lg border border-white/10 bg-slate-900/60 p-3"><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={editingId === null ? replyTarget ? "Write a nested reply..." : "Write a comment..." : "Edit your reply..."} aria-label="Reply content" rows={3} className="w-full resize-none bg-transparent text-sm text-white outline-none" /><div className="mt-2 flex items-center justify-between"><span className="text-xs text-slate-500">{replyTarget ? "Replying to a comment" : "Join the discussion"}</span><button type="button" onClick={() => void submit()} disabled={saving || !content.trim()} className="vf-btn-primary px-3 py-2 text-sm">{saving ? "Saving..." : editingId === null ? "Reply" : "Save"}</button></div></div>
    {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
  </section>;
}