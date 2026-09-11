"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "../../lib/api";
import { useAuth } from "./AuthProvider";
import ConfirmModal from "./ConfirmModal";

export default function BottomNav() {
  const path = usePathname();
  const { currentUser } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block md:hidden border-t border-white/6 bg-slate-900/70 backdrop-blur-sm">
      <div className="vf-container flex items-center justify-around py-2">
        <Link href="/" className={`flex flex-col items-center text-xs ${path === "/" ? "text-white" : "text-slate-300"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mb-0.5">
            <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Feed</span>
        </Link>
        <Link href="/communities" className={`flex flex-col items-center text-xs ${path.startsWith("/communities") ? "text-white" : "text-slate-300"}`}><span className="mb-0.5 text-lg">◎</span><span>Spaces</span></Link>
        <Link href="/messages" className={`flex flex-col items-center text-xs ${path.startsWith("/messages") ? "text-white" : "text-slate-300"}`}><span className="mb-0.5 text-lg">◌</span><span>Messages</span></Link>
        <Link href="/notifications" className={`flex flex-col items-center text-xs ${path.startsWith("/notifications") ? "text-white" : "text-slate-300"}`}><span className="mb-0.5 text-lg">○</span><span>Alerts</span></Link>
        <Link href={currentUser ? `/profile/${encodeURIComponent(currentUser.username)}` : "/login"} className={`flex flex-col items-center text-xs ${path.startsWith("/profile") ? "text-white" : "text-slate-300"}`}><span className="mb-0.5 text-lg">◉</span><span>Profile</span></Link>
        <button type="button" className="flex flex-col items-center text-xs text-slate-300" onClick={() => setConfirmOpen(true)} aria-label="Logout" title="Logout"><span className="mb-0.5 text-lg">↗</span><span>Logout</span></button>
        <ConfirmModal open={confirmOpen} title="Log out" description="Are you sure you want to log out?" confirmLabel="Log out" cancelLabel="Cancel" onCancel={() => setConfirmOpen(false)} onConfirm={() => { logout(); if (typeof window !== "undefined") window.location.href = "/login"; }} />
      </div>
    </nav>
  );
}
