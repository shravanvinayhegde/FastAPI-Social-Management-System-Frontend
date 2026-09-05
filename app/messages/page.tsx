"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Conversation, createConversation, getConversations, getCurrentUserId } from "../../lib/api";
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
    void getConversations().then(setItems).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load conversations.")).finally(() => setLoading(false));
  }, [router]);
  return <div className="mx-auto max-w-3xl space-y-6"><section className="vf-page-heading"><div><p className="vf-eyebrow">Private conversations</p><h1>Messages</h1><p>Keep the conversation moving.</p></div></section>{error ? <ErrorBanner message={error} /> : null}{loading ? <Loading label="Loading conversations..." /> : items.length === 0 ? <Empty title="No conversations yet" message="Start a conversation from someone&apos;s profile." /> : <div className="space-y-2">{items.map((conversation) => <Link key={conversation.id} href={`/messages/${conversation.id}`} className="vf-card vf-card-link flex items-center justify-between gap-4 p-4"><div><p className="font-semibold">Conversation with user {conversation.user_one_id === getCurrentUserId() ? conversation.user_two_id : conversation.user_one_id}</p><p className="mt-1 text-sm text-slate-400">Updated {new Date(conversation.updated_at).toLocaleString()}</p></div></Link>)}</div>}</div>;
}