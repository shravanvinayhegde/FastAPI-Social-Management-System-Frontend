"use client";

import React from "react";
import { getToken } from "../../lib/api";
import DefaultAvatarSvg from "./DefaultAvatarSvg";

type AvatarProps = {
  email?: string;
  id?: number;
  size?: number;
  avatarUrl?: string | null;
};

function initials(text?: string) {
  if (!text) return "?";
  // Use the username portion (before @) and return the first letter only
  const username = String(text).split("@")[0].trim();
  if (!username) return "?";
  return username[0].toUpperCase();
}

export default function Avatar({ email, id, size = 40, avatarUrl }: AvatarProps) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  // If no email prop provided, try to extract email/username from stored token
  let source = email;
  if (!source) {
    try {
      const token = getToken();
      if (token) {
        const parts = token.split(".");
        if (parts.length >= 2) {
          const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
          const payload = JSON.parse(atob(padded)) as Record<string, any>;
          source = payload.email ?? payload.username ?? payload.sub ?? source;
        }
      }
    } catch {
      // ignore and fall back
    }
  }

  const label = initials(source ?? String(id ?? "?"));
  // If there's no source and no id, render the default SVG avatar
  if (!source && (id === undefined || id === null)) {
    return (
      <div style={{ width: size, height: size }} aria-hidden>
        <DefaultAvatarSvg size={size} />
      </div>
    );
  }

  const hue = (source ? [...String(source)].reduce((s, c) => s + c.charCodeAt(0), 0) : (id ?? 1) * 37) % 360;

  const bg = `hsl(${hue} 60% 30%)`;

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg }}
      aria-hidden
    >
      <span className="text-sm">{label}</span>
    </div>
  );
}
