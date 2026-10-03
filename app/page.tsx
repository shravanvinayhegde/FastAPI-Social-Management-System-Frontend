"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PostCard from "./components/PostCard";
import Composer from "./components/Composer";
import FeedTabs from "./components/FeedTabs";
import SideNav from "./components/SideNav";
import { ColdStartNotice, Empty, ErrorBanner, PostSkeletonList } from "./components/Feedback";
import { ArrowUpIcon } from "./components/Icons";
import { deletePost, getPosts, getToken, PostWithVotes, updatePost } from "../lib/api";
import { useAuth } from "./components/AuthProvider";

const PAGE_SIZE = 20;

function HomeFeed() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";            // reactive: the old code read window.location once, so header search did nothing on "/"
  const { currentUser } = useAuth();

  const [posts, setPosts] = useState<PostWithVotes[]>([]);
  const [mode, setMode] = useState<"new" | "top">("new");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const generation = useRef(0);               // drops responses from a stale query

  // First page (re-runs whenever ?q= changes)
  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    const gen = ++generation.current;
    setIsLoading(true); setError(""); setHasMore(true);
    getPosts({ ...(q ? { search: q } : {}), limit: PAGE_SIZE, skip: 0 })
      .then((res) => { if (gen !== generation.current) return; setPosts(res); setHasMore(res.length === PAGE_SIZE); })
      .catch((e) => { if (gen === generation.current) setError(e instanceof Error ? e.message : "Unable to load posts right now."); })
      .finally(() => { if (gen === generation.current) setIsLoading(false); });
  }, [q, router]);

  // Next pages: the old feed requested skip=0 only, so posts #21+ were unreachable.
  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || error) return;
    const gen = generation.current;
    setIsLoadingMore(true);
    try {
      const res = await getPosts({ ...(q ? { search: q } : {}), limit: PAGE_SIZE, skip: posts.length });
      if (gen !== generation.current) return;
      setPosts((prev) => { const seen = new Set(prev.map((p) => p.Post.id)); return [...prev, ...res.filter((p) => !seen.has(p.Post.id))]; });
      setHasMore(res.length === PAGE_SIZE);
    } catch (e) {
      if (gen === generation.current) setError(e instanceof Error ? e.message : "Unable to load more posts.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, error, q, posts.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) void loadMore(); }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDeletePost = async (postId: number) => { await deletePost(postId); setPosts((prev) => prev.filter((p) => p.Post.id !== postId)); };
  const handleUpdatePost = async (postId: number, nextTitle: string, nextContent: string) => {
    const updated = await updatePost(postId, nextTitle, nextContent, true);
    setPosts((prev) => prev.map((p) => (p.Post.id === postId ? { ...p, Post: updated } : p)));
  };

  // "Top" sorts the posts already loaded (as before) - derived, so switching tabs costs no request.
  const visible = mode === "top" ? [...posts].sort((a, b) => b.votes - a.votes) : posts;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,600px)] lg:justify-center xl:grid-cols-[240px_minmax(0,600px)_300px]">
      <aside className="hidden lg:block"><SideNav /></aside>

      <section className="min-w-0" aria-label="Feed">
        <h1 className="sr-only">Home feed</h1>
        <div className="vfx-bleed">
          <FeedTabs mode={mode} onChange={setMode} />

          {q ? (
            <p className="vfx-notice text-left!">
              Results for <strong>“{q}”</strong> · <Link href="/" className="font-semibold text-[hsl(var(--accent))]">Clear</Link>
            </p>
          ) : null}

          <div className="vfx-list md:mt-3">
            <Composer onCreate={(created) => setPosts((prev) => [{ Post: created, votes: 0 }, ...prev])} />

            {isLoading ? <PostSkeletonList /> : null}
            {!isLoading && error ? <div className="px-4 md:px-0"><ErrorBanner message={error} /></div> : null}
            {!isLoading && !error && visible.length === 0 ? <Empty title={q ? "No matching posts" : "No posts yet"} message={q ? "Try a different search." : "Be the first to create a post."} /> : null}

            {visible.map((post) => (
              <PostCard
                key={post.Post.id}
                postId={post.Post.id}
                title={post.Post.title}
                content={post.Post.content}
                votes={post.votes}
                voted={post.voted}
                postedBy={post.Post.owner?.display_name || post.Post.owner?.username || "Unknown user"}
                ownerId={post.Post.owner_id}
                ownerUsername={post.Post.owner?.username}
                ownerAvatarUrl={post.Post.owner?.avatar_url}
                postedAt=""
                createdAt={post.Post.created_at}
                imageUrl={post.Post.image_url}
                videoUrl={post.Post.video_url}
                media={post.Post.media}
                isOwner={currentUser?.id === post.Post.owner_id}
                onDelete={handleDeletePost}
                onUpdate={handleUpdatePost}
              />
            ))}

            {isLoadingMore ? <PostSkeletonList count={1} /> : null}
            <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
            {!isLoading && !hasMore && visible.length > 0 ? <p className="vfx-notice">You’re all caught up.</p> : null}
          </div>
          <ColdStartNotice active={isLoading} />
        </div>
      </section>

      <aside className="hidden xl:block">
        <div className="vfx-rail">
          <section className="vf-card p-4">
            <p className="vf-eyebrow">Discover</p>
            <h2 className="mt-2 text-lg font-semibold">Find your people</h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">Explore communities and connect with members who share your interests.</p>
            <Link href="/communities" className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-[hsl(var(--accent))]">Browse communities →</Link>
          </section>
        </div>
      </aside>

      {showScrollTop ? (
        <button type="button" className="vf-btn-primary vfx-fab" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
          <ArrowUpIcon />
        </button>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  // useSearchParams() requires a Suspense boundary for static prerendering.
  return (
    <Suspense fallback={<PostSkeletonList />}>
      <HomeFeed />
    </Suspense>
  );
}
