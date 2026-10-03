"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { BellIcon, ChatIcon, HomeIcon, UserIcon, UsersIcon } from "./Icons";

/** Desktop left rail (>=1024px), X / Reddit style. */
export default function SideNav() {
  const path = usePathname() ?? "/";
  const { currentUser } = useAuth();
  const items = [
    { href: "/", label: "Home", Icon: HomeIcon, active: path === "/" },
    { href: "/communities", label: "Communities", Icon: UsersIcon, active: path.startsWith("/communities") },
    { href: "/messages", label: "Messages", Icon: ChatIcon, active: path.startsWith("/messages") },
    { href: "/notifications", label: "Notifications", Icon: BellIcon, active: path.startsWith("/notifications") },
    ...(currentUser ? [{ href: `/profile/${encodeURIComponent(currentUser.username)}`, label: "Profile", Icon: UserIcon, active: path.startsWith("/profile") }] : []),
  ];
  return (
    <nav className="vfx-rail" aria-label="Sections">
      {items.map(({ href, label, Icon, active }) => (
        <Link key={href} href={href} className="vfx-railink" aria-current={active ? "page" : undefined}>
          <Icon filled={active} /><span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
