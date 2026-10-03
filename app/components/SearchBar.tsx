"use client";

import React, { useState } from "react";
import { SearchIcon } from "./Icons";

type SearchBarProps = { onSearch: (q: string) => void; autoFocus?: boolean };

export default function SearchBar({ onSearch, autoFocus = false }: SearchBarProps) {
  const [q, setQ] = useState("");
  const submit = (e: React.FormEvent) => { e.preventDefault(); onSearch(q.trim()); };

  return (
    <form onSubmit={submit} className="w-full" role="search">
      <label className="relative block">
        <span className="sr-only">Search posts</span>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--foreground-muted)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          enterKeyHint="search"
          autoFocus={autoFocus}
          placeholder="Search posts"
          /* text-base = 16px: anything smaller makes iOS Safari zoom the page on focus */
          className="vf-input rounded-full! pl-10! text-base"
        />
      </label>
    </form>
  );
}
