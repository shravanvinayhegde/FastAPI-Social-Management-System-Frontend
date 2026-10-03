"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import { createPostWithMedia, PostEntity } from "../../lib/api";
import Avatar from "./Avatar";
import { useAuth } from "./AuthProvider";
import { CloseIcon, ImageIcon, VideoIcon } from "./Icons";

type ComposerProps = { onCreate: (post: PostEntity) => void; communityId?: number };

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
export const MAX_TITLE = 120;   // Reddit allows 300; 120 keeps titles to ~2 lines on a phone
export const MAX_BODY = 5000;   // the API has no limit for posts; replies/messages are 2000

/** The API requires a title, but the UI says "(optional)". Derive one from the first line instead of silently doing nothing. */
function deriveTitle(body: string) {
  const first = (body.trim().split(/\r?\n/)[0] ?? "").replace(/\s+/g, " ").trim();
  return first.length > 80 ? `${first.slice(0, 79).trimEnd()}…` : first;
}

export default function Composer({ onCreate, communityId }: ComposerProps) {
  const { currentUser: user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (open) bodyRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (!image) { setImagePreview(null); return; }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  useEffect(() => {
    if (!video) { setVideoPreview(null); return; }
    const url = URL.createObjectURL(video);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [video]);

  const selectFile = (file: File | undefined, kind: "image" | "video") => {
    if (!file) return;
    const validType = kind === "image"
      ? ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      : ["video/mp4", "video/webm", "video/quicktime"].includes(file.type);
    const maxSize = kind === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (!validType) { setError(`Choose a supported ${kind} file.`); return; }
    if (file.size > maxSize) { setError(`${kind === "image" ? "Images" : "Videos"} must be smaller than ${kind === "image" ? "10 MB" : "100 MB"}.`); return; }
    setError("");
    if (kind === "image") setImage(file); else setVideo(file);
  };

  const reset = () => { setTitle(""); setContent(""); setImage(null); setVideo(null); setError(""); setOpen(false); };

  const finalTitle = title.trim() || deriveTitle(content);
  const canPost = Boolean(content.trim() && finalTitle) && !isSubmitting;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canPost) return;
    setIsSubmitting(true);
    setError("");
    try {
      const created = await createPostWithMedia(finalTitle, content.trim(), { image, video }, true, communityId);
      onCreate(created);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatar = <Avatar size={40} email={user?.email} id={user?.id} avatarUrl={user?.avatar_url} />;

  // Collapsed: one 44px row (X / Facebook / LinkedIn). The old composer was 280px tall and pushed the first post below the fold.
  if (!open) {
    return (
      <div className="vfx-composer flex items-center gap-3">
        {avatar}
        <button type="button" className="vfx-composer-pill" onClick={() => setOpen(true)}>Start a post…</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="vfx-composer" aria-label="Create post">
      <div className="flex gap-3">
        <div className="pt-1">{avatar}</div>
        <div className="min-w-0 flex-1">
          <input
            className="vfx-field vfx-title-field"
            value={title}
            maxLength={MAX_TITLE}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            aria-label="Title"
            enterKeyHint="next"
          />
          <textarea
            ref={bodyRef}
            className="vfx-field"
            value={content}
            maxLength={MAX_BODY}
            rows={4}
            onChange={(e) => setContent(e.target.value)}
            onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 320)}px`; }}
            placeholder="What's happening?"
            aria-label="Post text"
          />

          {imagePreview ? (
            <div className="relative mt-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Selected image preview" className="h-28 w-28 rounded-xl object-cover" />
              <button type="button" className="vfx-iconbtn vfx-remove" aria-label="Remove image" onClick={() => setImage(null)}><CloseIcon className="h-4 w-4" /></button>
            </div>
          ) : null}
          {videoPreview ? (
            <div className="relative mt-2 inline-block">
              <video src={videoPreview} className="h-28 w-48 rounded-xl object-cover" muted playsInline controls />
              <button type="button" className="vfx-iconbtn vfx-remove" aria-label="Remove video" onClick={() => setVideo(null)}><CloseIcon className="h-4 w-4" /></button>
            </div>
          ) : null}

          {error ? <p role="alert" className="mt-2 text-sm text-[var(--vfx-danger)]">{error}</p> : null}

          <div className="mt-2 flex items-center gap-1 border-t border-[var(--vfx-border)] pt-2">
            <label className="vfx-iconbtn vfx-accent cursor-pointer" title="Add image">
              <ImageIcon /><span className="sr-only">Add image</span>
              <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { selectFile(e.target.files?.[0], "image"); e.target.value = ""; }} />
            </label>
            <label className="vfx-iconbtn vfx-accent cursor-pointer" title="Add video">
              <VideoIcon /><span className="sr-only">Add video</span>
              <input className="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => { selectFile(e.target.files?.[0], "video"); e.target.value = ""; }} />
            </label>

            <span className="vfx-count ml-auto mr-2" data-warn={content.length > MAX_BODY * 0.95} aria-live="polite">
              {content.length > MAX_BODY * 0.8 ? `${content.length}/${MAX_BODY}` : ""}
            </span>
            <button type="button" className="vf-btn-secondary min-h-[44px] px-4 text-sm" onClick={reset}>Cancel</button>
            <button type="submit" className="vf-btn-primary ml-1" disabled={!canPost}>{isSubmitting ? "Posting…" : "Post"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}
