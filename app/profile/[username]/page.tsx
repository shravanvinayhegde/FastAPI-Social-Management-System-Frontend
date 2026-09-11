"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import {
  ApiError,
  createConversation,
  getCurrentUserId,
  getProfile,
  getProfileCommunities,
  getProfileLikes,
  getProfileMedia,
  getProfilePosts,
  getProfileReplies,
  ProfileResponse,
  updateMyProfile,
  uploadAvatar,
} from "../../../lib/api";
import Avatar from "../../components/Avatar";
import FollowButton from "../../components/FollowButton";
import PostCard from "../../components/PostCard";
import ProfileConnections from "../../components/ProfileConnections";
import { Empty, ErrorBanner, Loading } from "../../components/Feedback";

type Tab = "posts" | "replies" | "media" | "likes";

export default function UsernameProfilePage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [posts, setPosts] = useState<Awaited<ReturnType<typeof getProfilePosts>>>([]);
  const [replies, setReplies] = useState<Awaited<ReturnType<typeof getProfileReplies>>>([]);
  const [communities, setCommunities] = useState<Awaited<ReturnType<typeof getProfileCommunities>>>([]);
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [tabPosts, setTabPosts] = useState<Awaited<ReturnType<typeof getProfilePosts>>>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [showCommunities, setShowCommunities] = useState(true);
  const [connectionKind, setConnectionKind] = useState<"followers" | "following" | null>(null);
  const isOwnProfile = Boolean(profile && getCurrentUserId() === profile.user.id);
  const isPrivate = profile?.privacy.visibility === "private" && !isOwnProfile;

  const load = async () => {
    setLoading(true); setError("");
    try {
      const next = await getProfile(username);
      setProfile(next); setDisplayName(next.user.display_name); setBio(next.user.bio || "");
      setVisibility(next.privacy.visibility === "private" ? "private" : "public"); setShowCommunities(next.privacy.show_communities);
      if (!next.privacy.show_posts || next.privacy.visibility === "private") setPosts([]);
      else setPosts(await getProfilePosts(username, { limit: 20, skip: 0 }));
      if (next.privacy.show_communities && next.privacy.visibility !== "private") setCommunities(await getProfileCommunities(username, { limit: 20, skip: 0 }));
    } catch (loadError) {
      if (loadError instanceof ApiError) setError(loadError.status === 404 ? "This user does not exist." : loadError.status === 403 ? "This profile is private." : loadError.status === 401 ? "Please sign in to view this profile." : loadError.message);
      else setError(loadError instanceof Error ? loadError.message : "Unable to load profile.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [username]);
  useEffect(() => {
    if (!profile || isPrivate || activeTab === "posts") return;
    setTabLoading(true);
    const request = activeTab === "media" ? getProfileMedia(username) : activeTab === "likes" ? getProfileLikes(username) : getProfileReplies(username);
    void request.then((result) => activeTab === "replies" ? setReplies(result as Awaited<ReturnType<typeof getProfileReplies>>) : setTabPosts(result as Awaited<ReturnType<typeof getProfilePosts>>)).catch((tabError) => setError(tabError instanceof Error ? tabError.message : "Unable to load this tab.")).finally(() => setTabLoading(false));
  }, [activeTab, profile, username, isPrivate]);

  const save = async () => {
    setSaving(true); setError("");
    try { await updateMyProfile({ display_name: displayName.trim(), bio: bio.trim(), profile_visibility: visibility, show_communities: showCommunities }); await load(); setEditing(false); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save profile."); }
    finally { setSaving(false); }
  };

  const changeAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const next = await uploadAvatar(file); setProfile((current) => current ? { ...current, user: next.user, privacy: next.privacy, stats: next.stats, relationship: next.relationship } : current); }
    catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Unable to upload avatar."); }
    event.target.value = "";
  };

  const startMessage = async () => {
    if (!profile || messaging) return;
    setMessaging(true); setError("");
    try { const conversation = await createConversation(profile.user.id); router.push(`/messages/${conversation.id}`); }
    catch (messageError) { setError(messageError instanceof Error ? messageError.message : "Unable to start conversation."); setMessaging(false); }
  };

  if (loading) return <Loading label="Loading profile..." />;
  if (error && !profile) return <ErrorBanner message={error} />;
  if (!profile) return <Empty title="Profile unavailable" message={error || "We could not find this profile."} />;
  const visiblePosts = activeTab === "posts" ? posts : tabPosts;

  return <div className="mx-auto max-w-4xl space-y-5">
    <Link href="/" className="text-sm font-semibold text-[hsl(var(--accent))]">← Home</Link>
    <section className="vf-card overflow-visible p-0">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4"><Avatar id={profile.user.id} email={profile.user.username} avatarUrl={profile.user.avatar_url} size={72} /><div><p className="vf-eyebrow">@{profile.user.username}</p><h1 className="mt-1 text-2xl font-semibold">{profile.user.display_name}</h1><p className="mt-1 text-sm text-slate-400">Joined {new Date(profile.user.created_at).toLocaleDateString()}</p>{profile.user.bio ? <p className="mt-3 max-w-xl whitespace-pre-wrap text-sm text-slate-300">{profile.user.bio}</p> : null}<div className="mt-5 flex flex-wrap gap-5 text-sm"><button onClick={() => setConnectionKind("followers")}><strong className="text-white">{profile.stats.followers}</strong> followers</button><button onClick={() => setConnectionKind("following")}><strong className="text-white">{profile.stats.following}</strong> following</button><span><strong className="text-white">{profile.stats.posts}</strong> posts</span><span><strong className="text-white">{profile.stats.communities}</strong> communities</span></div></div></div>
        <div className="flex flex-wrap gap-2">{isOwnProfile ? <button className="vf-btn-secondary" onClick={() => setEditing((value) => !value)}>{editing ? "Close" : "Edit profile"}</button> : <><FollowButton userId={profile.user.id} /><button className="vf-btn-secondary" onClick={() => void startMessage()} disabled={messaging}>{messaging ? "Opening..." : "Message"}</button></>}</div>
      </div>
      {isOwnProfile && editing ? <div className="border-t border-white/10 p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Display name<input className="vf-input mt-2" maxLength={100} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label className="text-sm">Visibility<select className="vf-input mt-2" value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")}><option value="public">Public</option><option value="private">Private</option></select></label><label className="text-sm sm:col-span-2">Bio<textarea className="vf-input mt-2" rows={3} maxLength={500} value={bio} onChange={(event) => setBio(event.target.value)} /></label></div><div className="mt-4 flex flex-wrap gap-3"><label className="vf-btn-secondary cursor-pointer">Change avatar<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={changeAvatar} /></label><button className="vf-btn-primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save profile"}</button></div></div> : null}
    </section>
    {isPrivate ? <section className="vf-card p-8 text-center"><p className="vf-eyebrow">@{profile.user.username}</p><h2 className="mt-2 text-xl font-semibold">This account is private</h2><p className="mt-2 text-sm text-slate-400">Follow to see their posts and communities.</p></section> : <>
      <div className="flex gap-5 border-b border-white/10">{(["posts", "replies", "media", "likes"] as Tab[]).map((tab) => <button key={tab} className={`pb-3 text-sm capitalize ${activeTab === tab ? "border-b-2 border-[hsl(var(--accent))] text-white" : "text-slate-400"}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
      {error ? <ErrorBanner message={error} /> : null}{tabLoading ? <Loading label="Loading profile activity..." /> : activeTab === "replies" ? <div className="space-y-3">{replies.map((reply) => <article key={reply.id} className="vf-card p-4"><p className="text-sm text-slate-300">{reply.content}</p><p className="mt-2 text-xs text-slate-500">@{reply.owner?.username || profile.user.username} · {new Date(reply.created_at).toLocaleDateString()}</p></article>)}{!replies.length ? <Empty title="No replies yet" /> : null}</div> : <div className="space-y-4">{visiblePosts.map((post) => <PostCard key={post.Post.id} postId={post.Post.id} title={post.Post.title} content={post.Post.content} votes={post.votes} postedBy={post.Post.owner?.display_name || post.Post.owner?.username || "User"} ownerId={post.Post.owner_id} ownerUsername={post.Post.owner?.username} ownerAvatarUrl={post.Post.owner?.avatar_url} postedAt={new Date(post.Post.created_at).toLocaleDateString()} imageUrl={post.Post.image_url} videoUrl={post.Post.video_url} />)}{!visiblePosts.length ? <Empty title={`No ${activeTab} yet`} /> : null}</div>}
      {showCommunities ? <section><h2 className="mb-3 text-xl font-semibold">Communities</h2>{communities.length ? <div className="grid gap-3 sm:grid-cols-2">{communities.map((community) => <Link key={community.id} href={`/communities/${encodeURIComponent(community.slug || String(community.id))}`} className="vf-card vf-card-link p-4"><strong>{community.name}</strong><p className="mt-1 text-sm text-slate-400">{community.description}</p></Link>)}</div> : <Empty title="No communities yet" />}</section> : null}
    </>}
    {connectionKind ? <ProfileConnections username={username} kind={connectionKind} onClose={() => setConnectionKind(null)} /> : null}
  </div>;
}
