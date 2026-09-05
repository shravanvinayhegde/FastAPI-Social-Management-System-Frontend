"use client";

import { useEffect, useState } from "react";
import { getCurrentUserId, getFollowers, getFollowing, getMyCommunities, getUser, getPosts, PostWithVotes, updateMyProfile, UserOut } from "../../../lib/api";
import PostCard from "../../components/PostCard";
import { Loading, Empty, ErrorBanner } from "../../components/Feedback";
import FollowButton from "../../components/FollowButton";
import Link from "next/link";
import ProfileConnections from "../../components/ProfileConnections";
import Avatar from "../../components/Avatar";

export default function UserClient({ id }: { id: number }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [posts, setPosts] = useState<PostWithVotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [tab, setTab] = useState<"posts" | "replies" | "media" | "likes">("posts");
  const [connectionKind, setConnectionKind] = useState<"followers" | "following" | null>(null);
  const [communityCount, setCommunityCount] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [showPosts, setShowPosts] = useState(true);
  const [showCommunities, setShowCommunities] = useState(true);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const isOwnProfile = getCurrentUserId() === id;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const u = await getUser(id);
        if (cancelled) return;
        setUser(u);
        setDisplayName(u.display_name || "");
        setBio(u.bio || "");
        setShowPosts(u.show_posts !== false);
        setShowCommunities(u.show_communities !== false);
        setVisibility(u.profile_visibility === "private" ? "private" : "public");

        const [all, followers, following] = await Promise.all([
          getPosts({ limit: 50 }),
          getFollowers(id, { limit: 20, skip: 0 }),
          getFollowing(id, { limit: 20, skip: 0 }),
        ]);
        if (cancelled) return;
        const mine = all.filter((p) => p.Post.owner_id === id);
        setPosts(mine);
        setFollowersCount(followers.length === 20 ? 20 : followers.length);
        setFollowingCount(following.length === 20 ? 20 : following.length);
        if (getCurrentUserId() === id) {
          const communities = await getMyCommunities({ limit: 20, skip: 0 });
          if (!cancelled) setCommunityCount(communities.length === 20 ? 20 : communities.length);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unable to load user's posts.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) return <Loading label="Loading user..." />;
  if (error) return <ErrorBanner message={error} />;
  if (!user) return <ErrorBanner message="User not found." />;

  const saveProfile = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setEditError("");
    try {
      const updated = await updateMyProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        show_posts: showPosts,
        show_communities: showCommunities,
        profile_visibility: visibility,
      });
      setUser(updated);
      setIsEditing(false);
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="vf-card overflow-visible p-0">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex gap-4 p-6"><Avatar email={user.email} id={user.id} size={64} avatarUrl={user.avatar_url} /><div><p className="vf-eyebrow">Profile</p><h1 className="mt-2 text-2xl font-semibold">{user.display_name || user.email}</h1><p className="text-sm text-slate-400">@{user.username || user.email.split("@")[0]} · Joined {new Date(user.created_at).toLocaleDateString()}</p>{user.bio ? <p className="mt-3 max-w-xl whitespace-pre-wrap text-sm text-slate-300">{user.bio}</p> : null}<div className="mt-5 flex flex-wrap gap-5 text-sm"><span><strong className="text-white">{posts.length}</strong> posts</span><button onClick={() => setConnectionKind("followers")}><strong className="text-white">{followersCount === 20 ? "20+" : followersCount ?? "..."}</strong> followers</button><button onClick={() => setConnectionKind("following")}><strong className="text-white">{followingCount === 20 ? "20+" : followingCount ?? "..."}</strong> following</button>{isOwnProfile && showCommunities ? <span><strong className="text-white">{communityCount === 20 ? "20+" : communityCount ?? "..."}</strong> communities</span> : null}</div></div></div>
          <div className="flex flex-wrap gap-2 p-6 sm:justify-end">{isOwnProfile ? <button className="vf-btn-secondary" onClick={() => setIsEditing((value) => !value)}>{isEditing ? "Close editor" : "Edit profile"}</button> : <><FollowButton userId={id} /><Link className="vf-btn-secondary" href={`/messages?user=${id}`}>Message</Link></>}</div>
        </div>
        {isEditing ? <div className="border-t border-white/10 p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm"><span className="text-slate-400">Display name</span><input className="vf-input mt-2" maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label className="block text-sm"><span className="text-slate-400">Profile visibility</span><select className="vf-input mt-2" value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")}><option value="public">Public</option><option value="private">Private</option></select></label><label className="block text-sm sm:col-span-2"><span className="text-slate-400">Bio</span><textarea className="vf-input mt-2 min-h-24" maxLength={280} value={bio} onChange={(event) => setBio(event.target.value)} /><span className="mt-1 block text-right text-xs text-slate-500">{bio.length}/280</span></label></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><label className="flex items-center gap-2"><input type="checkbox" checked={showPosts} onChange={(event) => setShowPosts(event.target.checked)} /> Show my posts on my profile</label><label className="flex items-center gap-2"><input type="checkbox" checked={showCommunities} onChange={(event) => setShowCommunities(event.target.checked)} /> Show my communities</label></div>{editError ? <p className="mt-3 text-sm text-rose-300">{editError}</p> : null}<button className="vf-btn-primary mt-4" onClick={() => void saveProfile()} disabled={isSaving}>{isSaving ? "Saving..." : "Save profile"}</button></div> : null}
        <div className="profile-tabs" role="tablist" aria-label="Profile content"><button className={tab === "posts" ? "profile-tab profile-tab-active" : "profile-tab"} onClick={() => setTab("posts")} role="tab" aria-selected={tab === "posts"}>Posts</button><button className={tab === "replies" ? "profile-tab profile-tab-active" : "profile-tab"} onClick={() => setTab("replies")} role="tab" aria-selected={tab === "replies"}>Replies</button><button className={tab === "media" ? "profile-tab profile-tab-active" : "profile-tab"} onClick={() => setTab("media")} role="tab" aria-selected={tab === "media"}>Media</button><button className={tab === "likes" ? "profile-tab profile-tab-active" : "profile-tab"} onClick={() => setTab("likes")} role="tab" aria-selected={tab === "likes"}>Likes</button></div>
      </section>

      {connectionKind ? <ProfileConnections userId={id} kind={connectionKind} onClose={() => setConnectionKind(null)} /> : null}

      <section className="space-y-4">
        {tab !== "posts" ? <Empty title={`${tab[0].toUpperCase()}${tab.slice(1)} are not available yet`} message="This view will appear when the backend exposes the corresponding profile feed." /> : posts.length === 0 ? (
          <Empty title="No posts from this user" message="This user hasn't posted yet." />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.Post.id}
              postId={post.Post.id}
              title={post.Post.title}
              content={post.Post.content}
              votes={post.votes}
              postedBy={post.Post.owner?.email ?? "Unknown"}
              ownerId={post.Post.owner_id}
              postedAt={new Date(post.Post.created_at).toLocaleString()}
            />
          ))
        )}
      </section>
    </div>
  );
}
