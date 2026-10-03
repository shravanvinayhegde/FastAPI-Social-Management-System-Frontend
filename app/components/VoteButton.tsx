"use client";

import { UpvoteIcon } from "./Icons";
import { formatCount } from "../../lib/time";

type VoteButtonProps = { votes: number; hasVoted: boolean; isVoting?: boolean; onToggle: () => void };

/**
 * Single toggle upvote (tap again = remove). The old rail had a "▼" button that actually
 * meant "remove vote" - users read ▼ as "downvote". The API only supports dir 0|1, so a
 * toggle is both honest and one tap instead of two 30px targets.
 */
export default function VoteButton({ votes, hasVoted, isVoting = false, onToggle }: VoteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isVoting}
      aria-pressed={hasVoted}
      aria-label={`${hasVoted ? "Remove upvote" : "Upvote"}, ${votes} ${votes === 1 ? "vote" : "votes"}`}
      className="vfx-action vfx-vote"
    >
      <UpvoteIcon filled={hasVoted} />
      <span className="tabular-nums">{formatCount(votes)}</span>
    </button>
  );
}
