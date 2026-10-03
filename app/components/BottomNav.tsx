"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "../../lib/api";
import { useAuth } from "./AuthProvider";
import { BellIcon, ChatIcon, HomeIcon, UserIcon, UsersIcon } from "./Icons";

const HIDDEN_ON = ["/login", "/register"];

/**
 * 5 destinations (iOS HIG: 3–5, Material: 3–5). "Logout" was removed: a destructive action
 * next to Profile is a mis-tap hazard; it now lives in the header account menu.
 */
export default function BottomNav() {
  const path = usePathname() ?? "/";
  const { currentUser } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    let alive = true;
    getUnreadNotificationCount().then((n) => alive && setUnread(n)).catch(() => {});
    return () => { alive = false; };
  }, [currentUser, path]);

  if (!currentUser || HIDDEN_ON.includes(path)) return null;

  const items = [
    { href: "/", label: "Home", Icon: HomeIcon, active: path === "/" },
    { href: "/communities", label: "Spaces", Icon: UsersIcon, active: path.startsWith("/communities") },
    { href: "/messages", label: "Messages", Icon: ChatIcon, active: path.startsWith("/messages") },
    { href: "/notifications", label: "Alerts", Icon: BellIcon, active: path.startsWith("/notifications"), badge: unread },
    { href: `/profile/${encodeURIComponent(currentUser.username)}`, label: "Profile", Icon: UserIcon, active: path.startsWith("/profile") },
  ];

  return (
    <nav className="vfx-tabbar" aria-label="Primary">
      <ul>
        {items.map(({ href, label, Icon, active, badge }) => (
          <li key={href}>
            <Link href={href} className="vfx-tab" aria-current={active ? "page" : undefined}>
              <Icon filled={active} />
              <span>{label}</span>
              {badge ? <span className="vfx-badge" aria-label={`${badge} unread`}>{badge > 99 ? "99+" : badge}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
