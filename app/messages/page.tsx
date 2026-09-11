"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Conversation, createConversation, getConversations, getCurrentUserId, getUser } from "../../lib/api";
import Avatar from "../components/Avatar";
import { Empty, ErrorBanner, Loading } from "../components/Feedback";

export default function MessagesPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    const requestedUser = new URL(window.location.href).searchParams.get("user");
    const userId = requestedUser ? Number(requestedUser) : null;
    if (userId && Number.isInteger(userId) && userId > 0 && userId !== getCurrentUserId()) {
      void createConversation(userId).then((conversation) => router.replace(`/messages/${conversation.id}`)).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to start conversation.")).finally(() => setLoading(false));
      return;
    }
    void getConversations().then(async (conversations) => Promise.all(conversations.map(async (conversation) => {
      if (conversation.participant || conversation.other_user) return conversation;
      const otherId = conversation.user_one_id === getCurrentUserId() ? conversation.user_two_id : conversation.user_one_id;
      try { return { ...conversation, participant: await getUser(otherId) }; } catch { return conversation; }
    }))).then(setItems).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load conversations.")).finally(() => setLoading(false));
  }, [router]);
  return <div className="mx-auto max-w-3xl space-y-6"><section className="vf-page-heading"><div><p className="vf-eyebrow">Private conversations</p><h1>Messages</h1><p>Keep the conversation moving.</p></div></section>{error ? <ErrorBanner message={error} /> : null}{loading ? <Loading label="Loading conversations..." /> : items.length === 0 ? <Empty title="No conversations yet" message="Start a conversation from someone&apos;s profile." /> : <div className="space-y-2">{items.map((conversation) => { const person = conversation.participant || conversation.other_user; const message = conversation.latest_message || conversation.last_message; return <Link key={conversation.id} href={`/messages/${conversation.id}`} className="vf-card vf-card-link flex items-center gap-3 p-4"><Avatar id={person?.id} email={person?.email} avatarUrl={person?.avatar_url} size={48} /><div className="min-w-0 flex-1"><p className="font-semibold">{person?.display_name || person?.username || "Conversation"}</p><p className="text-sm text-slate-400">@{person?.username || "user"}</p><p className="mt-1 truncate text-sm text-slate-300">{message?.content || "No messages yet"}</p></div><div className="text-right text-xs text-slate-500"><time>{new Date(message?.created_at || conversation.updated_at).toLocaleString()}</time>{conversation.unread_count ? <span className="mt-1 block text-[hsl(var(--accent))]">{conversation.unread_count} new</span> : null}</div></Link>; })}</div>}</div>;
}