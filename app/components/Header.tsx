"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";
import { useRouter } from "next/navigation";
import { getToken } from "../../lib/api";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const [isAuthed, setIsAuthed] = useState(false);
  const { currentUser: user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    setIsAuthed(Boolean(token));
    if (!token) return;

  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/6 bg-transparent backdrop-blur-sm">
      <div className="vf-container flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold" aria-label="Home">
            <span style={{ color: "hsl(var(--accent))" }}>Vote</span>Flow
          </Link>
        </div>

        <div className="hidden md:flex md:flex-1 md:justify-center md:px-6">
          <div className="w-full max-w-2xl">
            <SearchBar onSearch={(q) => router.push(q ? `/?q=${encodeURIComponent(q)}` : `/`)} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthed ? (
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              <Link className="vf-nav-link" href="/communities">Communities</Link>
              <Link className="vf-nav-link" href="/messages">Messages</Link>
              <Link className="vf-nav-link" href="/notifications">Notifications</Link>
            </nav>
          ) : null}

          {/* user / actions */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {isAuthed && user ? (
              <div className="relative">
                  <div className="flex items-center gap-2" role="img" aria-label="User avatar">
                    <Avatar size={36} email={user.email} id={user.id} avatarUrl={user.avatar_url} />
                    <div className="hidden lg:block">
                      <div className="text-sm font-medium text-slate-200 truncate max-w-[12rem]">
                        {user.display_name || user.username || user.email}
                      </div>
                      <div className="text-xs text-slate-400">@{user.username || user.email.split("@")[0]}</div>
                    </div>
                  </div>
                </div>
            ) : isAuthed && loading ? (
              <div className="h-9 w-9 rounded-full bg-slate-700 animate-pulse" />
            ) : (
              <Link href="/login">
                <button className="vf-btn-secondary px-3 py-1 text-sm">Sign in</button>
              </Link>
            )}
          </div>

          {/* mobile menu toggle */}
          <button
            type="button"
            className="md:hidden vf-btn-secondary px-2 py-1"
            onClick={() => setMobileOpen((s) => !s)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            title="Menu"
          >
            {mobileOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen ? (
        <div id="mobile-menu" className="md:hidden border-t border-white/6 bg-transparent backdrop-blur-sm">
          <div className="vf-container flex flex-col gap-2 px-4 py-3">
            <Link href="/" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">
              Feed
            </Link>
            {isAuthed ? <>
              <Link href="/communities" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">Communities</Link>
              <Link href="/messages" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">Messages</Link>
              <Link href="/notifications" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">Notifications</Link>
            </> : null}
            {!isAuthed ? (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">
                Sign in
              </Link>
            ) : user ? (
              <div onClick={() => setMobileOpen(false)} className="flex items-center gap-2" role="img" aria-label="User avatar">
                <Avatar size={32} email={user.email} id={user.id} />
                <span className="text-sm text-slate-200">{user.email}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
