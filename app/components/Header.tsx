"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "./AuthProvider";
import { SearchIcon, CloseIcon } from "./Icons";
import { logout } from "../../lib/api";

export default function Header() {
  const { currentUser: user } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: Event) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const runSearch = (q: string) => {
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
    setSearchOpen(false);
  };

  const handleLogout = () => {
    logout();
    setConfirmOpen(false);
    window.location.href = "/login";
  };

  return (
    <header className="vfx-header">
      <div className="vfx-header-inner">
        <Link href="/" className="vfx-logo" aria-label="VoteFlow home"><span>Vote</span>Flow</Link>

        {/* Desktop / tablet search */}
        <div className="mx-4 hidden min-w-0 flex-1 justify-center md:flex">
          <div className="w-full max-w-xl"><SearchBar onSearch={runSearch} /></div>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {/* Phone search: it was display:none below 768px, so search was impossible on mobile */}
          <span className="vfx-md-hide">
            <button type="button" className="vfx-iconbtn" onClick={() => setSearchOpen((s) => !s)} aria-expanded={searchOpen} aria-label={searchOpen ? "Close search" : "Search posts"}>
              {searchOpen ? <CloseIcon /> : <SearchIcon />}
            </button>
          </span>

          <ThemeToggle />

          {user ? (
            <div className="relative" ref={menuRef}>
              <button type="button" className="vfx-iconbtn" onClick={() => setMenuOpen((s) => !s)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label="Account menu">
                <Avatar size={32} email={user.email} id={user.id} avatarUrl={user.avatar_url} />
              </button>
              {menuOpen ? (
                <div className="vfx-menu" role="menu">
                  <Link role="menuitem" href={`/profile/${encodeURIComponent(user.username)}`} onClick={() => setMenuOpen(false)}>
                    <span className="min-w-0 truncate">{user.display_name || user.username}</span>
                  </Link>
                  <Link role="menuitem" href="/communities" onClick={() => setMenuOpen(false)}>Communities</Link>
                  <button role="menuitem" type="button" className="vfx-danger" onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}>Log out</button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link href="/login" className="vf-btn-secondary inline-flex min-h-[44px] items-center px-4 text-sm">Sign in</Link>
          )}
        </div>
      </div>

      {searchOpen ? (
        <div className="vfx-searchrow md:hidden"><SearchBar onSearch={runSearch} autoFocus /></div>
      ) : null}

      <ConfirmModal open={confirmOpen} title="Log out" description="Are you sure you want to log out?" confirmLabel="Log out" cancelLabel="Cancel" onCancel={() => setConfirmOpen(false)} onConfirm={handleLogout} />
    </header>
  );
}
