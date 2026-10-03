"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Conversation, getConversations, PostMedia, sendSharedPostMessage, sharePost, vote } from "../../lib/api";
import { fullDate, timeAgo } from "../../lib/time";
import VoteButton from "./VoteButton";
import PostMediaView from "./PostMediaView";
import Avatar from "./Avatar";
import ReplySection from "./ReplySection";
import ConfirmModal from "./ConfirmModal";
import { CommentIcon, MoreIcon, ShareIcon } from "./Icons";

type PostCardProps = {
  title: string;
  content: string;
  votes: number;
  voted?: boolean;
  postId: number;
  postedBy: string;
  /** Pre-formatted string kept for backwards compatibility with other pages. */
  postedAt: string;
  /** NEW: raw ISO timestamp. When present the card shows "5m / 3h / Oct 1" instead of a long date. */
  createdAt?: string;
  ownerId?: number;
  ownerUsername?: string | null;
  ownerAvatarUrl?: string | null;
  isOwner?: boolean;
  onDelete?: (postId: number) => Promise<void>;
  onUpdate?: (postId: number, title: string, content: string) => Promise<void>;
  imageUrl?: string | null;
  videoUrl?: string | null;
  media?: PostMedia[];
};

const CLAMP_CHARS = 360;

export default function PostCard({
  title, content, votes, voted = false, postId, postedBy, postedAt, createdAt,
  ownerId, ownerUsername, ownerAvatarUrl, isOwner = false, onDelete, onUpdate,
  imageUrl, videoUrl, media = [],
}: PostCardProps) {
  const [currentVotes, setCurrentVotes] = useState(votes);
  const [hasVoted, setHasVoted] = useState(voted);
  const [isVoting, setIsVoting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);
  const [error, setError] = useState("");
  const [shareCount, setShareCount] = useState(0);
  const [isShared, setIsShared] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const postUrl = typeof window !== "undefined" ? `${window.location.origin}/post/${postId}` : `/post/${postId}`;
  const when = createdAt ? timeAgo(createdAt) : postedAt;
  const whenTitle = createdAt ? fullDate(createdAt) : postedAt;
  const isLong = content.length > CLAMP_CHARS || content.split("\n").length > 8;

  // Optimistic: flip instantly, reconcile with the server answer, roll back on failure.
  const handleVote = async (dir: 0 | 1) => {
    if (isVoting) return;
    const prev = { votes: currentVotes, voted: hasVoted };
    setIsVoting(true);
    setError("");
    setHasVoted(dir === 1);
    setCurrentVotes((v) => Math.max(0, v + (dir === 1 ? 1 : -1)));
    try {
      const status = await vote(postId, dir);
      setCurrentVotes(status.vote_count);
      setHasVoted(status.voted);
    } catch (voteError) {
      setCurrentVotes(prev.votes);
      setHasVoted(prev.voted);
      setError(voteError instanceof Error ? voteError.message : "Unable to submit vote.");
    } finally {
      setIsVoting(false);
    }
  };

  const recordShare = async () => {
    try {
      const result = await sharePost(postId);
      setIsShared(result.shared);
      setShareCount(result.share_count);
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "Unable to share post.");
    }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(postUrl); await recordShare(); setShareMessage("Link copied"); }
    catch (copyError) { setError(copyError instanceof Error ? copyError.message : "Unable to copy link."); }
  };

  const deviceShare = async () => {
    try {
      const canShare = typeof navigator.share === "function";
      if (canShare) await navigator.share({ title, text: content, url: postUrl });
      else await navigator.clipboard.writeText(postUrl);
      await recordShare();
      setShareMessage(canShare ? "Shared" : "Link copied");
    } catch (shareError) {
      if ((shareError as DOMException).name !== "AbortError") setError(shareError instanceof Error ? shareError.message : "Unable to share post.");
    }
  };

  const openShare = async () => {
    setShareOpen(true);
    setShareMessage("");
    try { setConversations(await getConversations()); } catch { setConversations([]); }
  };

  const shareToConversation = async () => {
    if (!selectedConversation) return;
    try { await sendSharedPostMessage(Number(selectedConversation), postId); await recordShare(); setShareMessage("Sent"); }
    catch (shareError) { setError(shareError instanceof Error ? shareError.message : "Unable to send post."); }
  };

  const handleSave = async () => {
    if (!onUpdate || isSaving) return;
    setIsSaving(true);
    setError("");
    try { await onUpdate(postId, editTitle, editContent); setIsEditing(false); }
    catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Unable to update post."); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);
    setError("");
    try { await onDelete(postId); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Unable to delete post."); setIsDeleting(false); }
    setConfirmDelete(false);
  };

  return (
    <article className="vfx-post" aria-labelledby={`post-${postId}-title`}>
      {/* ── Header: avatar · name · time · @handle · overflow ─────────────── */}
      <header className="flex items-start gap-3">
        <Avatar email={postedBy} id={ownerId} avatarUrl={ownerAvatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-1.5">
            {ownerUsername ? (
              <Link href={`/profile/${encodeURIComponent(ownerUsername)}`} className="vfx-author min-w-0 truncate">{postedBy}</Link>
            ) : (
              <span className="vfx-author min-w-0 truncate">{postedBy}</span>
            )}
            <span className="vfx-meta shrink-0" aria-hidden>·</span>
            <time className="vfx-meta shrink-0" dateTime={createdAt} title={whenTitle}>{when}</time>
          </div>
          {ownerUsername ? <div className="vfx-meta truncate">@{ownerUsername}</div> : null}
        </div>

        {isOwner ? (
          <div className="relative -mr-2">
            <button type="button" className="vfx-iconbtn" aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Post options" onClick={() => setMenuOpen((s) => !s)}>
              <MoreIcon />
            </button>
            {menuOpen ? (
              <div className="vfx-menu" role="menu" onMouseLeave={() => setMenuOpen(false)}>
                <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); setIsEditing(true); }}>Edit post</button>
                <button role="menuitem" type="button" className="vfx-danger" onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}>Delete post</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      {isEditing ? (
        <div className="mt-3 space-y-2">
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} aria-label="Edit title" maxLength={120} className="vf-input" />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={5} aria-label="Edit content" className="vf-input" />
          <div className="flex justify-end gap-2 pb-2">
            <button type="button" className="vf-btn-secondary px-4 py-2.5 text-sm" onClick={() => { setIsEditing(false); setEditTitle(title); setEditContent(content); }}>Cancel</button>
            <button type="button" className="vf-btn-primary" disabled={isSaving || !editTitle.trim() || !editContent.trim()} onClick={() => void handleSave()}>{isSaving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      ) : (
        <>
          <h2 id={`post-${postId}-title`} className="vfx-title">
            <Link href={`/post/${postId}`}>{title}</Link>
          </h2>
          <p className={`vfx-body ${isLong && !expanded ? "vfx-clamp" : ""}`}>{content}</p>
          {isLong ? (
            <button type="button" className="vfx-more" onClick={() => setExpanded((s) => !s)} aria-expanded={expanded}>
              {expanded ? "Show less" : "Show more"}
            </button>
          ) : null}
          <PostMediaView media={media} imageUrl={imageUrl} videoUrl={videoUrl} title={title} />

          {/* ── Action bar: every target is 44px tall ───────────────────────── */}
          <footer className="vfx-actions">
            <VoteButton votes={currentVotes} hasVoted={hasVoted} isVoting={isVoting} onToggle={() => void handleVote(hasVoted ? 0 : 1)} />
            <button type="button" className="vfx-action" aria-expanded={showReplies} onClick={() => setShowReplies((s) => !s)} aria-label={showReplies ? "Hide comments" : "Show comments"}>
              <CommentIcon /><span>{showReplies ? "Hide" : "Comment"}</span>
            </button>
            <button type="button" className="vfx-action" onClick={() => void openShare()} aria-label="Share post">
              <ShareIcon /><span>{isShared ? "Shared" : "Share"}{shareCount ? ` ${shareCount}` : ""}</span>
            </button>
          </footer>
        </>
      )}

      {showReplies && !isEditing ? <ReplySection postId={postId} /> : null}
      {error ? <p role="alert" className="pb-3 text-sm text-[var(--vfx-danger)]">{error}</p> : null}

      <ConfirmModal
        open={confirmDelete}
        title="Delete post?"
        description="This can't be undone."
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        cancelLabel="Cancel"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
      />

      {/* ── Share: bottom sheet on phones, dialog on desktop ──────────────── */}
      {shareOpen && typeof document !== "undefined"
        ? createPortal(
            <>
              <div className="vfx-sheet-backdrop" onClick={() => setShareOpen(false)} />
              <div className="vfx-sheet" role="dialog" aria-modal="true" aria-label="Share post">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Share post</h3>
                  <button type="button" className="vfx-iconbtn -mr-2" onClick={() => setShareOpen(false)} aria-label="Close"><span aria-hidden className="text-2xl leading-none">×</span></button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="vf-btn-secondary min-h-[44px] px-4 text-sm" onClick={() => void copyLink()}>Copy link</button>
                  <button type="button" className="vf-btn-secondary min-h-[44px] px-4 text-sm" onClick={() => void deviceShare()}>Share via device</button>
                </div>
                <div className="mt-4 flex gap-2">
                  <select className="vf-input min-w-0 flex-1" value={selectedConversation} onChange={(e) => setSelectedConversation(e.target.value)} aria-label="Send to a conversation">
                    <option value="">Send in a message…</option>
                    {conversations.map((c) => {
                      const person = c.other_user || c.participant;
                      return <option key={c.id} value={c.id}>{person?.display_name || person?.username || "User"}{person?.username ? ` @${person.username}` : ""}</option>;
                    })}
                  </select>
                  <button type="button" className="vf-btn-primary" disabled={!selectedConversation} onClick={() => void shareToConversation()}>Send</button>
                </div>
                {shareMessage ? <p role="status" className="mt-3 text-sm font-semibold text-[hsl(var(--accent))]">{shareMessage}</p> : null}
              </div>
            </>,
            document.body,
          )
        : null}
    </article>
  );
}
