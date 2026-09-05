"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Community, getCommunity, getCommunityPosts, joinCommunity, leaveCommunity, PostWithVotes } from "../../../lib/api";
import PostCard from "../../components/PostCard";
import { Empty, ErrorBanner, Loading } from "../../components/Feedback";

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const communityId = Number(params.id);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<PostWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!Number.isInteger(communityId) || communityId < 1) { setError("This community link is invalid."); setLoading(false); return; }
    void Promise.all([getCommunity(communityId), getCommunityPosts(communityId, { limit: 20, skip: 0, sort: "new" })]).then(([nextCommunity, nextPosts]) => { setCommunity(nextCommunity); setPosts(nextPosts); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load this community.")).finally(() => setLoading(false));
  }, [communityId]);
  const toggleMembership = async () => { if (!community || joining) return; setJoining(true); setError(""); try { if (joined) { await leaveCommunity(community.id); } else { await joinCommunity(community.id); } setJoined((value) => !value); } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Unable to update membership."); } finally { setJoining(false); } };
  if (loading) return <Loading label="Loading community..." />;
  if (error && !community) return <ErrorBanner message={error} />;
  if (!community) return <Empty title="Community unavailable" />;
  return <div className="space-y-6"><Link href="/communities" className="text-sm font-semibold text-[hsl(var(--accent))]">← All communities</Link><section className="vf-card p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="vf-eyebrow">Community</p><h1 className="mt-2 text-3xl font-semibold">{community.name}</h1><p className="mt-3 max-w-2xl text-slate-400">{community.description || "A place for thoughtful conversation."}</p><p className="mt-4 text-sm text-slate-500">{community.member_count ?? 0} members · Created {community.created_at ? new Date(community.created_at).toLocaleDateString() : "recently"}</p></div><button onClick={() => void toggleMembership()} disabled={joining} className={community.is_member || joined ? "vf-btn-secondary" : "vf-btn-primary"}>{joining ? "Updating..." : community.is_member || joined ? "Leave community" : "Join community"}</button></div></section>{error ? <ErrorBanner message={error} /> : null}<section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Latest posts</h2><span className="text-sm text-slate-500">New</span></div>{posts.length === 0 ? <Empty title="No posts yet" message="Be the first to start the conversation." /> : posts.map((post) => <PostCard key={post.Post.id} postId={post.Post.id} title={post.Post.title} content={post.Post.content} votes={post.votes} postedBy={post.Post.owner?.email || "Community member"} ownerId={post.Post.owner_id} ownerUsername={post.Post.owner?.username} imageUrl={post.Post.image_url} videoUrl={post.Post.video_url} postedAt={new Date(post.Post.created_at).toLocaleDateString()} />)}</section></div>;
}