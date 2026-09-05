"use client";

import { useState } from "react";
import Link from "next/link";
import { vote } from "../../lib/api";
import VoteRail from "./VoteRail";
import Avatar from "./Avatar";

type PostCardProps = {
  title: string;
  content: string;
  votes: number;
  postId: number;
  postedBy: string;
  postedAt: string;
  ownerId?: number;
  isOwner?: boolean;
  onDelete?: (postId: number) => Promise<void>;
  onUpdate?: (postId: number, title: string, content: string) => Promise<void>;
};

export default function PostCard({
  title,
  content,
  votes,
  postId,
  postedBy,
  postedAt,
  ownerId,
  isOwner = false,
  onDelete,
  onUpdate,
}: PostCardProps) {
  const [currentVotes, setCurrentVotes] = useState(votes);
  const [isVoting, setIsVoting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);
  const [error, setError] = useState("");

  const handleVote = async (dir: 0 | 1) => {
    if (isVoting) {
      return;
    }

    setIsVoting(true);
    setError("");

    try {
      await vote(postId, dir);
      setCurrentVotes((prev) => (dir === 1 ? prev + 1 : Math.max(0, prev - 1)));
    } catch (voteError) {
      const message = voteError instanceof Error ? voteError.message : "Unable to submit vote.";
      setError(message);
    } finally {
      setIsVoting(false);
    }
  };

  const handleSave = async () => {
    if (!onUpdate || isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onUpdate(postId, editTitle, editContent);
      setIsEditing(false);
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : "Unable to update post.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await onDelete(postId);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Unable to delete post.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="vf-post group rounded-[1rem] border border-white/10 bg-white/[0.025] p-4 transition hover:border-[hsl(var(--accent)/.28)] hover:shadow-lg">
      <div className="flex gap-4">
        <div className="hidden sm:flex sm:flex-col sm:items-center">
          <VoteRail
            votes={currentVotes}
            onUpvote={() => void handleVote(1)}
            onRemove={() => void handleVote(0)}
            isVoting={isVoting}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar email={postedBy} size={40} />
                <div>
                  {ownerId ? <Link href={`/u/${ownerId}`} className="text-sm font-semibold text-white hover:text-[hsl(var(--accent))]">{postedBy.split("@")[0].replace(/[._-]/g, " ").replace(/(^|\s)\S/g, (t) => t.toUpperCase())}</Link> : <h3 className="text-sm font-semibold text-white">{postedBy}</h3>}
                  <div className="text-xs text-slate-400">@{postedBy.split("@")[0]} • {postedAt}</div>
                </div>
              </div>

            <div>
              {isOwner ? (
                <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing((s) => !s)}
                      aria-pressed={isEditing}
                      className="vf-btn-secondary px-2 py-1 text-xs focus-visible"
                      title={isEditing ? "Cancel edit" : "Edit post"}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isDeleting}
                      aria-label="Delete post"
                      className="vf-btn-danger px-2 py-1 text-xs focus-visible"
                      title="Delete post"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                </div>
              ) : null}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-3 space-y-2">
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                aria-label="Edit title"
                className="w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-white outline-none focus-visible"
              />
              <textarea
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                rows={3}
                aria-label="Edit content"
                className="w-full rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-white outline-none focus-visible"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  aria-label="Save changes"
                  className="vf-btn-primary px-3 py-1 text-sm focus-visible"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-3">
                <h2 className="text-lg font-semibold leading-snug text-white">{title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{content}</p>
              </div>

              {/* mobile vote rail (bottom left) */}
              <div className="mt-3 sm:hidden">
                <VoteRail
                  votes={currentVotes}
                  onUpvote={() => void handleVote(1)}
                  onRemove={() => void handleVote(0)}
                  isVoting={isVoting}
                />
              </div>
            </>
          )}

          {!isEditing ? <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-xs text-slate-500"><button type="button" className="hover:text-[hsl(var(--accent))]" aria-label="Comment on post">Comment</button><button type="button" className="hover:text-[hsl(var(--accent))]" aria-label="Share post">Share</button><span className="ml-auto">{postedAt}</span></div> : null}

          {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
        </div>

        
      </div>
    </article>
  );
}
