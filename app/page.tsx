"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PostCard from "./components/PostCard";
import Composer from "./components/Composer";
import FeedTabs from "./components/FeedTabs";
// useSearchParams avoided to prevent prerender/suspense issues; use window.location in client effect
import { Loading, Empty, ErrorBanner } from "./components/Feedback";
import {
  createPost,
  deletePost,
  getCurrentUserId,
  getPosts,
  getToken,
  logout,
  PostWithVotes,
  updatePost,
} from "../lib/api";
import BottomNav from "./components/BottomNav";

function formatPostedTime(timestamp: string): string {
  if (!timestamp) {
    return "Unknown time";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithVotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setCurrentUserId(getCurrentUserId());
    const loadPosts = async (opts: { limit?: number; skip?: number; search?: string } = {}) => {
      setIsLoading(true);
      setError("");
      try {
        const response = await getPosts(opts);
        setPosts(response);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Unable to load posts right now.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    const q = typeof window !== "undefined" ? new URL(window.location.href).searchParams.get("q") ?? "" : "";
    if (q) {
      void loadPosts({ search: q, limit: 50, skip: 0 });
    } else {
      void loadPosts({ limit: 20, skip: 0 });
    }
  }, [router]);

  useEffect(() => {
    const handleWindowScroll = () => {
      setShowScrollTop(window.scrollY > 260);
    };

    handleWindowScroll();
    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, []);

  const handleDeletePost = async (postId: number) => {
    await deletePost(postId);
    setPosts((prev) => prev.filter((post) => post.Post.id !== postId));
  };

  const handleUpdatePost = async (postId: number, nextTitle: string, nextContent: string) => {
    const updated = await updatePost(postId, nextTitle, nextContent, true);
    setPosts((prev) =>
      prev.map((post) => (post.Post.id === postId ? { ...post, Post: updated } : post))
    );
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSearch = async (q: string) => {
    setIsLoading(true);
    try {
      const results = await getPosts({ search: q, limit: 50 });
      setPosts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  const [mode, setMode] = useState<"new" | "top">("new");

  const handleModeChange = (m: "new" | "top") => {
    setMode(m);
    if (m === "new") {
      void (async () => {
        setIsLoading(true);
        try {
          const results = await getPosts({ limit: 20, skip: 0 });
          setPosts(results);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to load posts");
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      // Top: sort client-side by votes
      setPosts((prev) => [...prev].sort((a, b) => b.votes - a.votes));
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen px-3 py-5 text-slate-100 sm:px-4 sm:py-8">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)_260px]">
        <aside className="hidden lg:block">
          <nav className="vf-card sticky top-24 p-3" aria-label="Feed navigation">
            <p className="vf-eyebrow px-3 py-2">Your space</p>
            <button onClick={() => handleModeChange("new")} className={`vf-sidebar-link ${mode === "new" ? "vf-sidebar-link-active" : ""}`}>⌂ <span>Home feed</span></button>
            <button onClick={() => handleModeChange("top")} className={`vf-sidebar-link ${mode === "top" ? "vf-sidebar-link-active" : ""}`}>↟ <span>Trending posts</span></button>
            <Link href="/communities" className="vf-sidebar-link">◎ <span>Communities</span></Link>
            <Link href="/messages" className="vf-sidebar-link">◌ <span>Messages</span></Link>
            <Link href="/notifications" className="vf-sidebar-link">○ <span>Notifications</span></Link>
            {currentUserId ? <Link href={`/u/${currentUserId}`} className="vf-sidebar-link">◉ <span>My profile</span></Link> : null}
          </nav>
        </aside>

        <section className="min-w-0 space-y-5">
          <header className="vf-page-heading"><div><p className="vf-eyebrow">The community pulse</p><h1>Home feed</h1><p>See what people are sharing and join the conversation.</p></div></header>
          <div className="vf-tabs-row"><FeedTabs mode={mode} onChange={handleModeChange} /><span className="hidden text-xs text-slate-500 sm:block">{posts.length} posts loaded</span></div>
          <Composer onCreate={(created) => setPosts((prev) => [{ Post: created, votes: 0 }, ...prev])} />

        {isLoading ? <Loading label="Loading posts..." /> : null}

        {!isLoading && error ? <ErrorBanner message={error} /> : null}

        {!isLoading && !error && posts.length === 0 ? (
          <Empty title="No posts yet" message="Be the first to create a post." />
        ) : null}

        {!isLoading && !error && posts.length > 0 ? (
          <div className="space-y-4 mx-auto max-w-[700px]">
            {posts.map((post) => (
              <PostCard
                key={post.Post.id}
                postId={post.Post.id}
                title={post.Post.title}
                content={post.Post.content}
                votes={post.votes}
                postedBy={post.Post.owner?.email ?? "Unknown user"}
                ownerId={post.Post.owner_id}
                postedAt={formatPostedTime(post.Post.created_at)}
                isOwner={currentUserId === post.Post.owner_id}
                onDelete={handleDeletePost}
                onUpdate={handleUpdatePost}
              />
            ))}
          </div>
        ) : null}

        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <section className="vf-card p-4"><p className="vf-eyebrow">Discover</p><h2 className="mt-2 text-lg font-semibold">Find your people</h2><p className="mt-2 text-sm text-slate-400">Explore communities and connect with members who share your interests.</p><Link href="/communities" className="mt-4 block text-sm font-semibold text-[hsl(var(--accent))]">Browse communities →</Link></section>
            <section className="vf-card p-4"><p className="vf-eyebrow">Quick links</p><div className="mt-3 space-y-2"><Link className="vf-widget-link" href="/notifications">Your notifications <span>→</span></Link><Link className="vf-widget-link" href="/messages">Open messages <span>→</span></Link>{currentUserId ? <Link className="vf-widget-link" href={`/u/${currentUserId}`}>View your profile <span>→</span></Link> : null}</div></section>
          </div>
        </aside>
      </div>

      {showScrollTop ? (
        <button
          type="button"
          onClick={handleScrollToTop}
          className="vf-btn-primary fixed bottom-4 right-4 z-50 px-3 py-2 text-xs shadow-xl sm:bottom-6 sm:right-6 sm:px-4 sm:py-3 sm:text-sm"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          Scroll to top
        </button>
      ) : null}

      <BottomNav />

    </main>
  );
}
