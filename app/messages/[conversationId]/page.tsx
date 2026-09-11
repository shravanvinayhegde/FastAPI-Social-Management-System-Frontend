"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Conversation, getConversation, getCurrentUserId, getMessages, getToken, markConversationRead, Message, sendMessage } from "../../../lib/api";
import { ReconnectingSocket, SocketStatus } from "../../../lib/websocket";
import { Empty, ErrorBanner, Loading } from "../../components/Feedback";
import Avatar from "../../components/Avatar";
import SharedPostCard from "../../components/SharedPostCard";

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  const conversationId = Number(params.conversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!Number.isInteger(conversationId) || conversationId < 1) { setError("This conversation link is invalid."); setLoading(false); return; }
    let active = true;
    void Promise.all([getConversation(conversationId), getMessages(conversationId, { limit: 50, skip: 0 })]).then(([nextConversation, nextMessages]) => { if (active) { setConversation(nextConversation); setMessages(nextMessages); } return markConversationRead(conversationId); }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load messages."); }).finally(() => { if (active) setLoading(false); });
    const socket = new ReconnectingSocket({ onStatus: setStatus, onEvent: (event) => { if (event.type !== "new_message" || event.conversation_id !== conversationId || !event.message) return; const incoming = event.message as Message; setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]); } });
    if (getToken()) socket.connect();
    return () => { active = false; socket.close(); };
  }, [conversationId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  const submit = async (event: FormEvent) => { event.preventDefault(); const content = draft.trim(); if (!content || sending) return; setSending(true); setError(""); try { const sent = await sendMessage(conversationId, content); setMessages((current) => current.some((message) => message.id === sent.id) ? current : [...current, sent]); setDraft(""); } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Unable to send message."); } finally { setSending(false); } };
  if (loading) return <Loading label="Loading messages..." />;
  if (error && messages.length === 0) return <ErrorBanner message={error} />;
  const other = conversation?.participant || conversation?.other_user;
  const currentUserId = getCurrentUserId();
  return <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl flex-col gap-4"><div className="flex items-center justify-between"><Link href="/messages" className="text-sm font-semibold text-[hsl(var(--accent))]">← Messages</Link><span className="text-xs text-slate-500">{status === "connected" ? "Live" : status === "connecting" ? "Reconnecting..." : "Offline"}</span></div><section className="vf-card flex min-h-0 flex-1 flex-col p-4 sm:p-6"><header className="flex items-center gap-3 border-b border-white/10 pb-4"><Avatar id={other?.id} email={other?.email} avatarUrl={other?.avatar_url} size={44} /><div><p className="font-semibold">{other?.display_name || other?.username || "Conversation"}</p><p className="text-sm text-slate-400">@{other?.username || "user"}</p></div></header><div className="min-h-[18rem] flex-1 space-y-3 overflow-y-auto py-4 pr-1" aria-live="polite">{messages.length === 0 ? <Empty title="No messages yet" message="Send the first message." /> : messages.map((message) => { const mine = message.sender_id === currentUserId; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "bg-[hsl(var(--accent)/.2)]" : "bg-white/5"}`}>{message.shared_post ? <SharedPostCard post={message.shared_post} /> : <p className="text-sm">{message.content}</p>}<time className="mt-1 block text-[11px] text-slate-500">{new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></div></div>; })}<div ref={endRef} /></div>{error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}<form onSubmit={submit} className="mt-4 flex gap-2 border-t border-white/10 pt-4"><input className="vf-input min-w-0 flex-1" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} placeholder="Write a message..." aria-label="Message" /><button className="vf-btn-primary px-4" disabled={sending || !draft.trim()}>{sending ? "Sending..." : "Send"}</button></form></section></div>;
}