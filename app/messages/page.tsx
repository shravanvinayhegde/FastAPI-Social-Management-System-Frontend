"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Conversation, getConversations } from "../../lib/api";
import { Empty, ErrorBanner, Loading } from "../components/Feedback";

export default function MessagesPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void getConversations().then(setItems).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load conversations.")).finally(() => setLoading(false)); }, []);
  return <div className="mx-auto max-w-3xl space-y-6"><section className="vf-page-heading"><div><p className="vf-eyebrow">Private conversations</p><h1>Messages</h1><p>Keep the conversation moving.</p></div></section>{error ? <ErrorBanner message={error} /> : null}{loading ? <Loading label="Loading conversations..." /> : items.length === 0 ? <Empty title="No conversations yet" message="Start a conversation from someone&apos;s profile." /> : <div className="space-y-2">{items.map((conversation) => <Link key={conversation.id} href={`/messages/${conversation.id}`} className="vf-card vf-card-link flex items-center justify-between gap-4 p-4"><div><p className="font-semibold">{conversation.other_user?.email || "Conversation"}</p><p className="mt-1 text-sm text-slate-400">{conversation.last_message?.content || "No messages yet"}</p></div>{conversation.unread_count ? <span className="vf-badge">{conversation.unread_count}</span> : null}</Link>)}</div>}</div>;
}