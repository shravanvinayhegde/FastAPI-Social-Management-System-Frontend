"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { getCurrentUserId, getProfile, getProfileCommunities, getProfilePosts, ProfileResponse, updateMyProfile, uploadAvatar } from "../../../lib/api";
import Avatar from "../../components/Avatar";
import FollowButton from "../../components/FollowButton";
import PostCard from "../../components/PostCard";
import ProfileConnections from "../../components/ProfileConnections";
import { Empty, ErrorBanner, Loading } from "../../components/Feedback";

export default function UsernameProfilePage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [posts, setPosts] = useState<Awaited<ReturnType<typeof getProfilePosts>>>([]);
  const [communities, setCommunities] = useState<Awaited<ReturnType<typeof getProfileCommunities>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [showPosts, setShowPosts] = useState(true);
  const [showCommunities, setShowCommunities] = useState(true);
  const [connectionKind, setConnectionKind] = useState<"followers" | "following" | null>(null);
  const isOwnProfile = Boolean(profile && getCurrentUserId() === profile.user.id);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const next = await getProfile(username);
      setProfile(next); setDisplayName(next.user.display_name); setBio(next.user.bio || ""); setVisibility(next.privacy.visibility === "private" ? "private" : "public"); setShowPosts(next.privacy.show_posts); setShowCommunities(next.privacy.show_communities);
      const [nextPosts, nextCommunities] = await Promise.all([
        next.privacy.show_posts ? getProfilePosts(username, { limit: 20, skip: 0 }) : Promise.resolve([]),
        next.privacy.show_communities ? getProfileCommunities(username, { limit: 20, skip: 0 }) : Promise.resolve([]),
      ]);
      setPosts(nextPosts); setCommunities(nextCommunities);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load profile."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [username]);

  const save = async () => {
    setSaving(true); setError("");
    try { await updateMyProfile({ display_name: displayName.trim(), bio: bio.trim(), profile_visibility: visibility, show_posts: showPosts, show_communities: showCommunities }); await load(); setEditing(false); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save profile."); }
    finally { setSaving(false); }
  };

  const changeAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const next = await uploadAvatar(file); setProfile((current) => current ? { ...current, user: next.user, privacy: next.privacy, stats: next.stats, relationship: next.relationship } : current); }
    catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Unable to upload avatar."); }
    event.target.value = "";
  };

  if (loading) return <Loading label="Loading profile..." />;
  if (error && !profile) return <ErrorBanner message={error} />;
  if (!profile) return <Empty title="Profile unavailable" />;
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/" className="text-sm font-semibold text-[hsl(var(--accent))]">← Home</Link><section className="vf-card overflow-visible p-0"><div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-4"><Avatar id={profile.user.id} email={profile.user.username} avatarUrl={profile.user.avatar_url} size={72} /><div><p className="vf-eyebrow">@{profile.user.username}</p><h1 className="mt-1 text-2xl font-semibold">{profile.user.display_name}</h1><p className="mt-1 text-sm text-slate-400">Joined {new Date(profile.user.created_at).toLocaleDateString()}</p>{profile.user.bio ? <p className="mt-3 max-w-xl whitespace-pre-wrap text-sm text-slate-300">{profile.user.bio}</p> : null}<div className="mt-5 flex flex-wrap gap-5 text-sm"><button onClick={() => setConnectionKind("followers")}><strong className="text-white">{profile.stats.followers}</strong> followers</button><button onClick={() => setConnectionKind("following")}><strong className="text-white">{profile.stats.following}</strong> following</button><span><strong className="text-white">{profile.stats.posts}</strong> posts</span><span><strong className="text-white">{profile.stats.communities}</strong> communities</span></div></div></div><div className="flex flex-wrap gap-2">{isOwnProfile ? <button className="vf-btn-secondary" onClick={() => setEditing((value) => !value)}>{editing ? "Close" : "Edit profile"}</button> : <FollowButton userId={profile.user.id} />}</div></div>{isOwnProfile && editing ? <div className="border-t border-white/10 p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Display name<input className="vf-input mt-2" maxLength={100} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label className="text-sm">Visibility<select className="vf-input mt-2" value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")}><option value="public">Public</option><option value="private">Private</option></select></label><label className="text-sm sm:col-span-2">Bio<textarea className="vf-input mt-2 min-h-24" maxLength={1000} value={bio} onChange={(event) => setBio(event.target.value)} /></label></div><div className="mt-3 flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={showPosts} onChange={(event) => setShowPosts(event.target.checked)} /> Show posts</label><label><input type="checkbox" checked={showCommunities} onChange={(event) => setShowCommunities(event.target.checked)} /> Show communities</label><label className="vf-btn-secondary cursor-pointer">Upload avatar<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void changeAvatar(event)} /></label></div><button className="vf-btn-primary mt-4" disabled={saving} onClick={() => void save()}>{saving ? "Saving..." : "Save profile"}</button></div> : null}<div className="profile-tabs"><span className="profile-tab profile-tab-active">Posts</span><span className="profile-tab">Replies</span><span className="profile-tab">Media</span><span className="profile-tab">Likes</span></div></section>{error ? <ErrorBanner message={error} /> : null}<section className="space-y-3"><h2 className="text-xl font-semibold">Posts</h2>{posts.length ? posts.map((post) => <PostCard key={post.Post.id} postId={post.Post.id} title={post.Post.title} content={post.Post.content} votes={post.votes} postedBy={post.Post.owner?.email || profile.user.username} ownerId={post.Post.owner_id} ownerUsername={post.Post.owner?.username} imageUrl={post.Post.image_url} videoUrl={post.Post.video_url} postedAt={new Date(post.Post.created_at).toLocaleDateString()} />) : <Empty title="No posts yet" message="This profile has no visible posts." />}</section>{showCommunities ? <section className="space-y-3"><h2 className="text-xl font-semibold">Communities</h2>{communities.length ? <div className="grid gap-3 sm:grid-cols-2">{communities.map((community) => <Link key={community.id} href={`/communities/${community.id}`} className="vf-card vf-card-link p-4"><strong>{community.name}</strong><p className="mt-1 text-sm text-slate-400">{community.description}</p></Link>)}</div> : <Empty title="No communities yet" />}</section> : null}{connectionKind ? <ProfileConnections username={username} kind={connectionKind} onClose={() => setConnectionKind(null)} /> : null}</div>;
}