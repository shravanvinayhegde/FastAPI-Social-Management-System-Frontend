"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { createPost, getCurrentUserId, getUser, PostEntity } from "../../lib/api";
import Avatar from "./Avatar";

type ComposerProps = {
  onCreate: (post: PostEntity) => void;
};

export default function Composer({ onCreate }: ComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const created = await createPost(title.trim(), content.trim(), true, { image_url: imageUrl.trim() || null, video_url: videoUrl.trim() || null });
      onCreate(created);
      setTitle("");
      setContent("");
      setImageUrl("");
      setVideoUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const id = getCurrentUserId();
    if (!id) return;
    getUser(id).then((u) => setUser(u)).catch(() => setUser(null));
  }, []);

  return (
    <form onSubmit={submit} className="vf-card rounded-[1.25rem] p-4" aria-label="Create post">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="pt-1">
            {user ? <Avatar size={40} email={user.email} id={user.id} /> : <Avatar size={40} />}
          </div>
        </div>
        <div className="flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-white outline-none focus-visible"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="What's happening?"
            className="mt-2 w-full resize-none rounded-md border border-white/10 bg-transparent px-3 py-2 text-white outline-none focus-visible"
          />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Image URL (optional)" className="vf-input" />
            <input type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="Video URL (optional)" className="vf-input" />
          </div>
          {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-300">
              <span className="decor-icon p-2 rounded-md" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 3v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="decor-icon p-2 rounded-md" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" />
                </svg>
              </span>
              <span className="decor-icon p-2 rounded-md" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 14l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 14h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 7H3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>

            </div>

            <div className="flex-shrink-0">
              <button
                type="submit"
                disabled={isSubmitting}
                className="vf-btn-primary px-4 py-2 text-sm disabled:opacity-60 focus-visible"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
