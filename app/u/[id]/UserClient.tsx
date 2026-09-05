"use client";

import { useEffect, useState } from "react";
import { getFollowers, getFollowing, getUser, getPosts, PostWithVotes, UserOut } from "../../../lib/api";
import PostCard from "../../components/PostCard";
import { Loading, Empty, ErrorBanner } from "../../components/Feedback";
import FollowButton from "../../components/FollowButton";
import Link from "next/link";

export default function UserClient({ id }: { id: number }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [posts, setPosts] = useState<PostWithVotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [tab, setTab] = useState<"posts" | "replies" | "media" | "likes">("posts");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const u = await getUser(id);
        if (cancelled) return;
        setUser(u);

        const [all, followers, following] = await Promise.all([
          getPosts({ limit: 50 }),
          getFollowers(id, { limit: 20, skip: 0 }),
          getFollowing(id, { limit: 20, skip: 0 }),
        ]);
        if (cancelled) return;
        const mine = all.filter((p) => p.Post.owner_id === id);
        setPosts(mine);
        setFollowersCount(followers.length === 20 ? 20 : followers.length);
        setFollowingCount(following.length === 20 ? 20 : following.length);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unable to load user's posts.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) return <Loading label="Loading user..." />;
  if (error) return <ErrorBanner message={error} />;
  if (!user) return <ErrorBanner message="User not found." />;

  return (
    <div className="space-y-6">
      <section className="vf-card overflow-visible p-0">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="p-6"><p className="vf-eyebrow">Profile</p><h1 className="mt-2 text-2xl font-semibold">{user.email}</h1><p className="mt-1 text-sm text-slate-400">Joined {new Date(user.created_at).toLocaleDateString()}</p><div className="mt-5 flex flex-wrap gap-5 text-sm"><span><strong className="text-white">{posts.length}</strong> posts</span><span><strong className="text-white">{followersCount === 20 ? "20+" : followersCount ?? "..."}</strong> followers</span><span><strong className="text-white">{followingCount === 20 ? "20+" : followingCount ?? "..."}</strong> following</span></div></div>
          <div className="flex flex-wrap gap-2 p-6 sm:justify-end"><FollowButton userId={id} /><Link className="vf-btn-secondary" href={`/messages?user=${id}`}>Message</Link></div>
        </div>
        <div className="profile-tabs" role="tablist" aria-label="Profile content"><button className={tab === "posts" ? "profile-tab profile-tab-active" : "profile-tab"} onClick={() => setTab("posts")} role="tab" aria-selected={tab === "posts"}>Posts</button><button className={tab === "replies" ? "profile-tab profile-tab-active" : "profile-tab"} onClick={() => setTab("replies")} role="tab" aria-selected={tab === "replies"}>Replies</button><button className={tab === "media" ? "profile-tab profile-tab-active" : "profile-tab"} onClick={() => setTab("media")} role="tab" aria-selected={tab === "media"}>Media</button><button className={tab === "likes" ? "profile-tab profile-tab-active" : "profile-tab"} onClick={() => setTab("likes")} role="tab" aria-selected={tab === "likes"}>Likes</button></div>
      </section>

      <section className="space-y-4">
        {tab !== "posts" ? <Empty title={`${tab[0].toUpperCase()}${tab.slice(1)} are not available yet`} message="This view will appear when the backend exposes the corresponding profile feed." /> : posts.length === 0 ? (
          <Empty title="No posts from this user" message="This user hasn't posted yet." />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.Post.id}
              postId={post.Post.id}
              title={post.Post.title}
              content={post.Post.content}
              votes={post.votes}
              postedBy={post.Post.owner?.email ?? "Unknown"}
              ownerId={post.Post.owner_id}
              postedAt={new Date(post.Post.created_at).toLocaleString()}
            />
          ))
        )}
      </section>
    </div>
  );
}
