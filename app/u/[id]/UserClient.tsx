"use client";

import { useEffect, useState } from "react";
import { getUser, getPosts, PostWithVotes, UserOut } from "../../../lib/api";
import PostCard from "../../components/PostCard";
import { Loading, Empty, ErrorBanner } from "../../components/Feedback";
import FollowButton from "../../components/FollowButton";
import Link from "next/link";

export default function UserClient({ id }: { id: number }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [posts, setPosts] = useState<PostWithVotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const u = await getUser(id);
        if (cancelled) return;
        setUser(u);

        const all = await getPosts({ limit: 50 });
        if (cancelled) return;
        const mine = all.filter((p) => p.Post.owner_id === id);
        setPosts(mine);
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
      <section className="vf-card p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div><p className="vf-eyebrow">Profile</p><h1 className="mt-2 text-2xl font-semibold">{user.email}</h1><p className="mt-1 text-sm text-slate-400">Joined {new Date(user.created_at).toLocaleDateString()}</p></div>
          <div className="flex flex-wrap gap-2"><FollowButton userId={id} /><Link className="vf-btn-secondary" href={`/messages?user=${id}`}>Message</Link></div>
        </div>
      </section>

      <section className="space-y-4">
        {posts.length === 0 ? (
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
              postedAt={new Date(post.Post.created_at).toLocaleString()}
            />
          ))
        )}
      </section>
    </div>
  );
}
