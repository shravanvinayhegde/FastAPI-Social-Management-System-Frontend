"use client";

import Link from "next/link";
import { resolveApiUrl, SharedPostPreview } from "../../lib/api";

type SharedPostCardProps = {
  post: SharedPostPreview;
};

export default function SharedPostCard({ post }: SharedPostCardProps) {
  const media = post.media ?? [];

  return (
    <Link href={`/post/${post.id}`} className="mt-2 block rounded-xl border border-white/10 bg-slate-950/50 p-3 transition hover:border-[hsl(var(--accent)/.45)]">
      <p className="text-sm font-semibold text-white">{post.title}</p>
      <p className="mt-1 line-clamp-3 text-sm text-slate-300">{post.content}</p>
      <p className="mt-2 text-xs text-slate-500">{post.owner?.display_name || post.owner?.username || "VoteFlow user"}</p>
      {media[0] ? media[0].media_type === "video" ? <video src={resolveApiUrl(media[0].url) ?? undefined} className="mt-2 max-h-40 w-full rounded-lg object-cover" /> : <img src={resolveApiUrl(media[0].url) ?? undefined} alt="Shared post" className="mt-2 max-h-40 w-full rounded-lg object-cover" /> : null}
      <span className="mt-3 block text-xs font-semibold text-[hsl(var(--accent))]">Open post →</span>
    </Link>
  );
}
