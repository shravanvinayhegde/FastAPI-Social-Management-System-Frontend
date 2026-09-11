"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, getPost, PostWithVotes } from "../../../lib/api";
import PostCard from "../../components/PostCard";
import { ErrorBanner, Loading } from "../../components/Feedback";

export default function PostPage({ params }: { params: { id: string } }) {
  const postId = Number(params.id);
  const [post, setPost] = useState<PostWithVotes | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(postId) || postId < 1) {
      setError("This post link is invalid.");
      return;
    }
    void getPost(postId).then(setPost).catch((loadError) => setError(loadError instanceof ApiError ? loadError.message : "Unable to load this post."));
  }, [postId]);

  if (error) return <ErrorBanner message={error} />;
  if (!post) return <Loading label="Loading post..." />;

  return <div className="mx-auto max-w-3xl space-y-4"><Link href="/" className="text-sm font-semibold text-[hsl(var(--accent))]">← Home</Link><PostCard postId={post.Post.id} title={post.Post.title} content={post.Post.content} votes={post.votes} postedBy={post.Post.owner?.display_name || post.Post.owner?.username || "User"} ownerId={post.Post.owner_id} ownerUsername={post.Post.owner?.username} ownerAvatarUrl={post.Post.owner?.avatar_url} postedAt={new Date(post.Post.created_at).toLocaleDateString()} imageUrl={post.Post.image_url} videoUrl={post.Post.video_url} media={post.Post.media} /></div>;
}
