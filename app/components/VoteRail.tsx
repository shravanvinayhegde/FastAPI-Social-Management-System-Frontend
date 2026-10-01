"use client";

import React from "react";

type VoteRailProps = {
  votes: number;
  onUpvote: () => void;
  onRemove: () => void;
  isVoting?: boolean;
  hasVoted?: boolean;
};

export default function VoteRail({ votes, onUpvote, onRemove, isVoting = false, hasVoted = false }: VoteRailProps) {
  return (
    <div className="flex flex-row items-center gap-3 text-center sm:flex-col sm:w-14">
      <button
        type="button"
        onClick={onUpvote}
        disabled={isVoting}
        aria-label="Upvote"
        aria-pressed={hasVoted}
        title={hasVoted ? "Already upvoted" : "Upvote"}
        className={`rounded-xl border px-2 py-2 text-sm font-semibold hover:bg-emerald-500/10 disabled:opacity-60 focus-visible ${
          hasVoted ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200" : "border-white/10 bg-white/3 text-emerald-300"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5l7 7H5l7-7z" fill="currentColor" />
        </svg>
      </button>
      <div className="text-sm font-semibold text-white tabular-nums">{votes}</div>
      <button
        type="button"
        onClick={onRemove}
        disabled={isVoting}
        aria-label="Remove vote"
        title="Remove vote"
        className="rounded-xl border border-white/10 bg-white/3 px-2 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-60 focus-visible"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 19l-7-7h14l-7 7z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
