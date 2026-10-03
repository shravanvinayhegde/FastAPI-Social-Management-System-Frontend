"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./Icons";

type Theme = "light" | "dark";
const STORAGE_KEY = "vf-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* private mode */ }
}

/** Icon-only (44x44) like X / Reddit / GitHub. The old "Switch to Light" pill took ~190px of a 390px header. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // The inline script in layout.tsx already set data-theme before paint; just mirror it.
    const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button type="button" onClick={toggle} className="vfx-iconbtn" aria-label={label} title={label}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
