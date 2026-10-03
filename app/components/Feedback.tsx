"use client";

import { useEffect, useState } from "react";

import React from "react";

export function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="vf-card flex items-center justify-center gap-3 p-6">
      <svg className="h-6 w-6 animate-spin text-[hsl(var(--accent))]" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2"></circle>
        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"></path>
      </svg>
      <div className="text-sm text-slate-200">{label}</div>
    </div>
  );
}

export function Empty({ title, message }: { title: string; message?: string }) {
  return (
    <div className="vf-card p-6 text-center">
      <div className="text-lg font-semibold">{title}</div>
      {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
      {message}
    </div>
  );
}

/** Skeleton rows keep the layout stable while loading (no spinner card -> content jump). */
export function PostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="vfx-list" aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="vfx-post" style={{ paddingBottom: 16 }}>
          <div className="flex items-center gap-3">
            <div className="vfx-skel h-10 w-10 rounded-full!" />
            <div className="flex-1 space-y-2"><div className="vfx-skel h-3.5 w-1/3" /><div className="vfx-skel h-3 w-1/4" /></div>
          </div>
          <div className="vfx-skel mt-4 h-5 w-4/5" />
          <div className="vfx-skel mt-3 h-3.5 w-full" />
          <div className="vfx-skel mt-2 h-3.5 w-11/12" />
          <div className="vfx-skel mt-4 h-9 w-48 rounded-full!" />
        </div>
      ))}
    </div>
  );
}

/** The API runs on a free tier that sleeps (README: 30-60s first request). Tell users instead of showing an endless spinner. */
export function ColdStartNotice({ active, afterMs = 6000 }: { active: boolean; afterMs?: number }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), afterMs);
    return () => clearTimeout(t);
  }, [active, afterMs]);
  if (!active || !slow) return null;
  return <p role="status" className="vfx-notice">Still connecting. The server may be waking up, which can take up to a minute on the first visit.</p>;
}
