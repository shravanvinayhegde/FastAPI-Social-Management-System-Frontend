# VoteFlow Frontend — Agent Fix Brief
Repo: `FastAPI-Social-Management-System-Frontend` (Next.js App Router)
Audited commit: `2ec6549` ("Fix frontend social flows")
Live app: `https://voteflow-phi.vercel.app/`
Companion doc: `backend-fixes.md` (apply both — several bugs are two-sided
contract mismatches between `lib/api.ts` and the FastAPI schemas)
 
---
 
## 0. Read this first — the two bugs you were asked to fix
 
### "Community not found" when opening a community that's in the list
**Code-level status: already fixed.** `lib/api.ts`'s `getCommunityBySlug()`
correctly calls `GET /communities/by-slug/{slug}`, matching the backend
route. There is no remaining frontend code bug here.
👉 If `voteflow-phi.vercel.app` still shows this error, the deployed build on
Vercel almost certainly predates this fix, **or** `NEXT_PUBLIC_API_URL` is
pointed at a stale/wrong backend. Go to §8 "Deployment verification" first.
 
### "This user does not exist" on your own and other people's profiles
**Root cause found — this is a real, present bug in this repo.** `getProfile()`
and every other profile sub-resource call in `lib/api.ts` are sent with
`{ auth: false }`, meaning **the request never includes the logged-in user's
token**, even when one exists. See §1 below — this is the highest-priority
fix in this document. It doesn't just affect error text: because the backend
never sees who's asking, private profiles reject their own owner with `403`,
and public profiles never show Edit/Follow/Message controls to anyone,
logged in or not. Fix this, then also verify deployment (§8) for the literal
404 case.
 
---
 
## 1. `lib/api.ts` — profile requests never send the auth token (P0)
 
**File:** `lib/api.ts`
 
```ts
export async function getProfile(username: string): Promise<ProfileResponse> {
  return request<ProfileResponse>(`/users/${encodeURIComponent(username)}/profile`, { method: "GET" }, { auth: false, json: true });
}
 
export async function getProfilePosts(username: string, options: GetUsersOptions = {}): Promise<PostWithVotes[]> {
  ...
  return request<PostWithVotes[]>(`/users/${encodeURIComponent(username)}/posts?${params.toString()}`, { method: "GET" }, { auth: false, json: true });
}
```
 
The same `{ auth: false }` pattern appears in `getProfileReplies`,
`getProfileMedia`, `getProfileLikes`, `getProfileUsers` (backs
`getProfileFollowers`/`getProfileFollowing`), and `getProfileCommunities` —
**every** profile-related read.
 
**Why this matters:** the backend's `GET /{username}/profile` handler
computes `viewer` from the `Authorization` header via
`oauth2.optional_oauth2_scheme`. With no header, `viewer` is always `None`,
so:
- A user who has set their profile to private is **locked out of their own
  profile page** (`403`), which reads to them exactly like "I can't open my
  profile."
- `actions.is_self`, `actions.can_follow`, and `actions.can_message` are
  always `false`, so the Edit button, Follow button, and Message button
  never render for anyone, on any profile — the page "works" but looks
  broken/non-interactive.
**Fix — change `auth: false` to `auth: true` on every profile call:**
 
```ts
export async function getProfile(username: string): Promise<ProfileResponse> {
  return request<ProfileResponse>(`/users/${encodeURIComponent(username)}/profile`, { method: "GET" }, { auth: true, json: true });
}
```
 
Apply the same one-word change to:
- `getProfilePosts`
- `getProfileReplies`
- `getProfileMedia`
- `getProfileLikes`
- `getProfileUsers` (used by `getProfileFollowers` / `getProfileFollowing`)
- `getProfileCommunities`
Confirm `request()`'s `auth: true` path degrades gracefully when there is no
token (i.e. it should simply omit the header rather than throw) so logged-out
visitors can still view public profiles — check the `request()`
implementation near the top of `lib/api.ts` before changing this, and adjust
it if it currently *requires* a token to be present when `auth: true`.
 
---
 
## 2. `app/components/AuthProvider.tsx` — fragile "who am I" lookup
 
**File:** `app/components/AuthProvider.tsx`
 
```tsx
useEffect(() => {
  const id = getCurrentUserId();
  if (!id) { setCurrentUser(null); setLoading(false); return; }
  getUser(id).then(setCurrentUser).catch(() => setCurrentUser(null)).finally(() => setLoading(false));
}, []);
```
 
This decodes the numeric user id out of the JWT client-side, then calls
`GET /users/{id}`. If that call fails for *any* reason (network blip, cold
Render start, token containing a differently-shaped `sub` claim, etc.),
`currentUser` silently becomes `null` — which hides the "My profile" link in
`BottomNav` and the sidebar, and makes the header look logged-out even
though the token is valid. This is exactly the kind of thing that looks like
"I can't get to my profile at all."
 
**Fix:** switch to the new `GET /users/me` endpoint added in
`backend-fixes.md` §2 — it's simpler, doesn't require decoding the JWT
client-side, and can't drift from whatever id claim the backend actually
issues:
 
```ts
// lib/api.ts
export async function getMe(): Promise<CurrentUser> {
  return request<CurrentUser>("/users/me", { method: "GET" }, { auth: true, json: true });
}
```
 
```tsx
// app/components/AuthProvider.tsx
useEffect(() => {
  if (!getToken()) { setCurrentUser(null); setLoading(false); return; }
  getMe().then(setCurrentUser).catch(() => setCurrentUser(null)).finally(() => setLoading(false));
}, []);
```
 
Until the backend endpoint ships, at minimum keep `getUser(id)` but add a
retry or a clearer console warning so this failure mode is diagnosable
instead of silently degrading the nav.
 
---
 
## 3. `app/components/ProfileConnections.tsx` — crashes on Followers/Following
 
**File:** `app/components/ProfileConnections.tsx`
 
```tsx
<p className="truncate font-medium">{person.display_name || person.email.split("@")[0]}</p>
<p className="truncate text-xs text-slate-500">@{person.username || person.email.split("@")[0]}</p>
```
 
When opened from a profile page, this component calls `getProfileFollowers`
/ `getProfileFollowing`, which hit the backend's `PublicUser` schema:
 
```python
class PublicUser(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_url: str
```
 
**There is no `email` field.** `person.email` is `undefined`, and
`person.email.split("@")[0]` throws `TypeError: Cannot read properties of
undefined (reading 'split')` — this crashes the Followers/Following modal
every time it's opened from a profile page (it happens to work when opened
from the generic ID-based `FollowButton` path, because that one calls
`getFollowers`/`getFollowing`, which return the full `UserOut` with email —
so the bug is specifically in the username-based profile path).
 
**Fix — stop depending on `email` for display, use fields `PublicUser`
actually has:**
 
```tsx
<p className="truncate font-medium">{person.display_name || person.username}</p>
<p className="truncate text-xs text-slate-500">@{person.username}</p>
```
 
And loosen the component's state typing so it doesn't lie about having
`email`:
 
```ts
const [users, setUsers] = useState<UserOut[]>([]);
// →
const [users, setUsers] = useState<PublicUser[]>([]);
```
 
(Add/export a `PublicUser` type in `lib/api.ts` matching the backend shape —
`{ id: number; username: string; display_name: string; avatar_url: string }`
— and use it as the real return type of `getProfileFollowers` /
`getProfileFollowing` / `getProfileUsers`, which are currently mistyped as
`Promise<UserOut[]>`.)
 
---
 
## 4. Home feed shows the poster's **email address** instead of their name
 
**File:** `app/page.tsx`
 
```tsx
postedBy={post.Post.owner?.email ?? "Unknown user"}
```
 
Every other place in the app (`app/profile/[username]/page.tsx`,
`app/post/[id]/page.tsx`, `app/components/SharedPostCard.tsx`,
`app/components/ReplySection.tsx`) correctly falls back to `display_name ||
username`. The home feed alone prints the raw email. This is both a display
bug (wrong label — "posted by jane@example.com" instead of a name/handle)
and, combined with `backend-fixes.md` §3, a live privacy leak on the public
feed.
 
**Fix:**
 
```tsx
postedBy={post.Post.owner?.display_name || post.Post.owner?.username || "Unknown user"}
```
 
Do this **after** the backend stops embedding `email` on public post
payloads (`backend-fixes.md` §3) — once that lands, `post.Post.owner?.email`
won't exist at all, so leaving this unfixed will just show
`"Unknown user"` for every post. Fix both sides together.
 
---
 
## 5. Sharing a post into a DM conversation is completely broken
 
**File:** `lib/api.ts`
 
```ts
export async function sendMessage(conversationId: number, content: string, postId?: number): Promise<Message> {
  return request<Message>(`/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ content, post_id: postId }) }, { auth: true, json: true });
}
 
export async function sendSharedPostMessage(conversationId: number, postId: number): Promise<Message> {
  return sendMessage(conversationId, "", postId);
}
```
 
Two independent bugs stack here:
 
1. **Wrong field name.** The backend's `MessageCreate` schema expects
   `shared_post_id`, not `post_id`. FastAPI/Pydantic silently ignores
   unknown fields by default, so `post_id` is dropped and `shared_post_id`
   is always `None` server-side — even when this call *doesn't* 422, the
   shared post preview never actually attaches to the message.
2. **Empty content is rejected.** `sendSharedPostMessage` intentionally sends
   `content: ""` (a share needs no caption), but the backend currently
   requires `min_length=1` on `content`, so the request 422s before it ever
   reaches bug #1.
**Fix — correct the field name; #2 requires the backend relaxation in
`backend-fixes.md` §4 to actually take effect:**
 
```ts
export async function sendMessage(conversationId: number, content: string, sharedPostId?: number): Promise<Message> {
  return request<Message>(
    `/conversations/${conversationId}/messages`,
    { method: "POST", body: JSON.stringify({ content, shared_post_id: sharedPostId }) },
    { auth: true, json: true }
  );
}
 
export async function sendSharedPostMessage(conversationId: number, postId: number): Promise<Message> {
  return sendMessage(conversationId, "", postId);
}
```
 
Both this change and the backend schema change in `backend-fixes.md` §4 are
required together — shipping only one still leaves sharing broken.
 
---
 
## 6. `app/components/SharedPostCard.tsx` — type doesn't match what the backend sends
 
**File:** `app/components/SharedPostCard.tsx`
 
```tsx
type SharedPostCardProps = { post: PostEntity | PostWithVotes };
```
 
The backend actually returns `Message.shared_post` as a `SharedPostPreview`
(`{ id, title, content, owner_id, owner, media, community, created_at }`) —
not a full `PostEntity` (which also has `published`, `image_url`,
`video_url`) and not the `{ Post, votes }` wrapper shape of `PostWithVotes`.
It happens to render correctly today only because the fields this component
actually reads (`id`, `title`, `content`, `owner`, `media`) overlap between
the shapes — but the typing is misleading and will bite the next person who
adds a field. Fix once §5 is shipped and shared posts start actually
appearing:
 
```ts
export type SharedPostPreview = {
  id: number;
  title: string;
  content: string;
  owner_id: number;
  owner?: PostOwner | null;
  media: PostMedia[];
  created_at: string;
};
```
 
```tsx
type SharedPostCardProps = { post: SharedPostPreview };
export default function SharedPostCard({ post }: SharedPostCardProps) {
  const media = post.media ?? [];
  // use `post.*` directly — no more `"Post" in post` unwrapping
  ...
}
```
 
Update `Message.shared_post`'s type in `lib/api.ts` to
`SharedPostPreview | null` accordingly.
 
---
 
## 7. `app/notifications/page.tsx` — notifications never show real content
 
**File:** `app/notifications/page.tsx`
 
```tsx
{typeof payload.message === "string" ? payload.message : "There is new activity waiting for you."}
```
 
No backend notification payload ever sets a `message` key (see
`backend-fixes.md` §6.1 — payload shapes differ per `type` and use keys like
`follower_id`, `post_id`/`reply_id`, `message_preview`/`actor_username`).
This condition is therefore always `false`, and every notification in the
list shows the same generic fallback text regardless of type.
 
**Fix — render per-type copy from the fields that actually exist, with the
generic fallback only as a last resort:**
 
```tsx
function describeNotification(item: Notification): string {
  const payload = (item.payload ?? {}) as Record<string, unknown>;
  switch (item.type) {
    case "NEW_FOLLOWER":
      return "Someone started following you.";
    case "NEW_REPLY":
    case "NEW_REPLY_TO_REPLY":
      return "Someone replied to your post.";
    case "NEW_MESSAGE": {
      const preview = typeof payload.message_preview === "string" ? payload.message_preview : "";
      const actor = typeof payload.actor_username === "string" ? `@${payload.actor_username}` : "Someone";
      return preview ? `${actor}: ${preview}` : `${actor} sent you a message.`;
    }
    default:
      return typeof payload.message === "string" ? payload.message : "There is new activity waiting for you.";
  }
}
```
 
and use `{describeNotification(item)}` in place of the current inline
ternary. If backend adopts the simpler fix in `backend-fixes.md` §6.1
(adding a `message` string to every payload at write time), this function
can be simplified back down to just reading `payload.message` — pick one
side to own this and don't do both, to avoid the two drifting again.
 
---
 
## 8. Deployment verification checklist (do this before assuming any code fix is needed)
 
1. In the Vercel dashboard, open the project → **Deployments**, and confirm
   the latest **Production** deployment's commit hash matches `2ec6549` (or
   later, whatever `origin/main` is when you read this) — not just that a
   deployment exists, but that it's the one marked Production/promoted.
2. Confirm `NEXT_PUBLIC_API_URL` is set in **Project Settings → Environment
   Variables** for the **Production** environment (not just Preview/
   Development) and points at the correct live backend, e.g.
   `https://fastapi-management-system.onrender.com`. This variable is
   inlined at **build time** by Next.js — if you add or change it, you must
   trigger a fresh build (redeploy), not just restart; a cached build will
   keep using the old value.
3. Open the deployed site, open browser dev tools → Network tab, click into
   a community and a profile, and confirm the actual request URLs are
   `.../communities/by-slug/<slug>` and `.../users/<username>/profile`
   against the expected backend host — if you see a different host, or a
   404/`Failed to fetch` at the network level (not a clean JSON `404` body),
   that confirms a stale/misconfigured deployment rather than a code bug.
4. Cross-check against `backend-fixes.md` §7 — the frontend can only be as
   fresh as the backend it's calling.
---
 
## 9. Minor polish (not blocking, but part of "all features")
 
| # | File | Note |
|---|------|------|
| 9.1 | `app/components/Header.tsx` | The user's avatar in the header isn't a link — clicking it does nothing. Wrap it in `<Link href={`/profile/${encodeURIComponent(user.username)}`}>` for a more discoverable path to "my profile" alongside the existing sidebar/BottomNav links. |
| 9.2 | `lib/api.ts` | `getConversationSummary()` calls `GET /conversations/{id}/summary`, which doesn't exist on the backend and isn't referenced anywhere in the app (dead code). Either delete it, or point it at the existing `GET /conversations/{id}` (same as `getConversation()`) if a "summary" variant was intended. |
| 9.3 | `app/register/page.tsx` | No username field at signup — usernames are auto-derived from email server-side. Not a bug, but worth a product decision: consider letting users pick a username at registration if custom handles matter. |
| 9.4 | repo root | Leftover `main.py` / `pyproject.toml` scaffolding (Python "hello world" files) from the project template are unused in this Next.js app — safe to delete for repo hygiene. |
 
---
 
## 10. Acceptance tests
 
After applying the fixes above (and the matching backend fixes) and
confirming deployment:
 
- [ ] Opening a community you can see in `/communities` never shows
      "Community not found."
- [ ] Opening your own profile succeeds even when `profile_visibility` is
      `"private"`, and shows an Edit button.
- [ ] Opening another user's public profile shows a working Follow button.
- [ ] Opening the Followers/Following modal from a profile page does not
      throw and lists usernames/display names correctly.
- [ ] The home feed shows poster display names/usernames, never raw email
      addresses.
- [ ] Sharing a post into an existing DM conversation succeeds and the
      recipient sees a rendered post-preview card, not an error or an empty
      bubble.
- [ ] The notifications list shows type-specific text (who followed you,
      who replied, message previews) instead of the same generic sentence
      for everything.
- [ ] `NEXT_PUBLIC_API_URL` in the Vercel production environment matches the
      live backend, confirmed via a Network-tab request inspection.
 