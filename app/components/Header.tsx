"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";
import { useRouter } from "next/navigation";
import { logout } from "../../lib/api";
import { useAuth } from "./AuthProvider";
import ConfirmModal from "./ConfirmModal";

export default function Header() {
  const { currentUser: user, loading } = useAuth();
  const isAuthed = Boolean(user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const router = useRouter();

  const handleLogout = () => {
    logout();
    setConfirmOpen(false);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

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

          <div className="hidden md:flex md:items-center md:gap-3">
            {isAuthed && user ? (
              <div className="relative flex items-center gap-2">
                <Link href={`/profile/${encodeURIComponent(user.username)}`} className="flex items-center gap-2" aria-label="Open my profile">
                  <Avatar size={36} email={user.email} id={user.id} avatarUrl={user.avatar_url} />
                  <div className="hidden lg:block">
                    <div className="text-sm font-medium text-slate-200 truncate max-w-[12rem]">
                      {user.display_name || user.username || user.email}
                    </div>
                    <div className="text-xs text-slate-400">@{user.username}</div>
                  </div>
                </Link>
                <button
                  type="button"
                  className="vf-btn-secondary px-3 py-1 text-sm"
                  onClick={() => setConfirmOpen(true)}
                  aria-label="Log out"
                  title="Log out"
                >
                  Log out
                </button>
              </div>
            ) : isAuthed && loading ? (
              <div className="h-9 w-9 rounded-full bg-slate-700 animate-pulse" />
            ) : (
              <Link href="/login">
                <button className="vf-btn-secondary px-3 py-1 text-sm">Sign in</button>
              </Link>
            )}
          </div>

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

      {mobileOpen ? (
        <div id="mobile-menu" className="md:hidden border-t border-white/6 bg-transparent backdrop-blur-sm">
          <div className="vf-container flex flex-col gap-2 px-4 py-3">
            <Link href="/" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">
              Feed
            </Link>
            {isAuthed ? (
              <>
                <Link href="/communities" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">Communities</Link>
                <Link href="/messages" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">Messages</Link>
                <Link href="/notifications" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">Notifications</Link>
              </>
            ) : null}
            {!isAuthed ? (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm text-slate-200">
                Sign in
              </Link>
            ) : user ? (
              <>
                <Link href={`/profile/${encodeURIComponent(user.username)}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2" aria-label="Open my profile">
                  <Avatar size={32} email={user.email} id={user.id} />
                  <span className="text-sm text-slate-200">{user.display_name || user.username}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setConfirmOpen(true);
                  }}
                  className="text-left text-sm text-slate-200"
                >
                  Log out
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={confirmOpen}
        title="Log out"
        description="Are you sure you want to log out?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
}
