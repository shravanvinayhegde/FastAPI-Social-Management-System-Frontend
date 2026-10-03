import type { SVGProps } from "react";

/** One consistent 24px / 1.75-stroke icon set (replaces the Unicode glyphs ◎ ◌ ○ ◉ ↗). */
type P = SVGProps<SVGSVGElement> & { filled?: boolean };
const base = (p: P) => ({
  width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  "aria-hidden": true, focusable: false, ...p,
});

export const HomeIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)}><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z" fill={filled ? "currentColor" : "none"} /></svg>
);
export const UsersIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.5" fill={filled ? "currentColor" : "none"} /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.2A6.5 6.5 0 0 1 21.5 20" /></svg>
);
export const ChatIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" fill={filled ? "currentColor" : "none"} /></svg>
);
export const BellIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" fill={filled ? "currentColor" : "none"} /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
);
export const UserIcon = ({ filled, ...p }: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" fill={filled ? "currentColor" : "none"} /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const SearchIcon = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></svg>);
export const SunIcon = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const MoonIcon = (p: P) => (<svg {...base(p)}><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" /></svg>);
export const MoreIcon = (p: P) => (<svg {...base(p)}><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></svg>);
export const UpvoteIcon = ({ filled, ...p }: P) => (<svg {...base(p)}><path d="M12 4 4.5 13h4.8v7h5.4v-7h4.8L12 4Z" fill={filled ? "currentColor" : "none"} /></svg>);
export const CommentIcon = (p: P) => (<svg {...base(p)}><path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9Z" /></svg>);
export const ShareIcon = (p: P) => (<svg {...base(p)}><path d="M12 15V3m0 0L8 7m4-4 4 4" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>);
export const ImageIcon = (p: P) => (<svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-9 9" /></svg>);
export const VideoIcon = (p: P) => (<svg {...base(p)}><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="m16 10.5 5-3v9l-5-3" /></svg>);
export const CloseIcon = (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const ArrowUpIcon = (p: P) => (<svg {...base(p)}><path d="M12 19V5m0 0-6 6m6-6 6 6" /></svg>);
