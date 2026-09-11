VoteFlow Frontend — Exact Fix Instructions

Repository: shravanvinayhegde/FastAPI-Social-Management-System-Frontend

Latest commit inspected: 738acb461e16d9453de462596da471e0c8a951b6 (Fix frontend social flows).

Scope

These instructions are specifically for the current latest frontend and are intended to fix:

View my profile / any profile showing user does not exist.

Image/video post submission failing with Failed to fetch.

Direct image/video upload and display.

Community pages showing invalid link.

Standard social-app messaging from another user's profile.

Standard social-app sharing.

Profile media/replies/likes tab correctness.

Do not revert the latest social-flow changes. The latest push already added username profile routes, slug-based community routes, media selection in the composer, reply UI, share UI, and richer messaging UI. The remaining problems are mostly frontend/backend contract mismatches and one incorrect response-shape assumption.

1. Fix getCommunityBySlug() URL immediately

File

lib/api.ts

Current code

The latest frontend calls:

return request<Community>(
  `/communities/slug/${encodeURIComponent(slug)}`,
  { method: "GET" },
  { auth: true, json: true }
);

Backend endpoint

The latest backend exposes:

GET /communities/by-slug/{slug}

Therefore these URLs do NOT match.

Required change

Replace:

`/communities/slug/${encodeURIComponent(slug)}`

with:

`/communities/by-slug/${encodeURIComponent(slug)}`

This is a confirmed frontend/backend route mismatch.

2. Fix the profile "user does not exist" path

Canonical rule

Use exactly one public profile route:

/profile/{username}

Do not use:

/u/{id}

for profile navigation.

The latest Home page and BottomNav were changed to username URLs, which is correct.

Verify every profile link

Search the entire repository for:

/u/

Every remaining profile-related use must be removed or intentionally redirected.

Search also for:

/profile/${

and make sure the value is always a real user.username.

Correct:

<Link href={`/profile/${encodeURIComponent(user.username)}`}>

Incorrect:

<Link href={`/profile/${user.id}`}>

Incorrect:

<Link href={`/profile/${user.display_name}`}>

3. Make View your profile independent from a fragile user-ID lookup

Current problem

Home currently gets the numeric ID from the JWT, then calls:

getUser(id)

to discover the username.

That is an unnecessary dependency for the most basic navigation action.

If that request fails, currentUsername remains null and the profile link disappears/fails.

Required improvement

After login, fetch the authenticated user once and store the complete user object in a client auth/context store.

Minimum shared state:

type CurrentUser = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  avatar_url?: string | null;
};

Then use:

currentUser.username

for:

My profile
Header user menu
Composer avatar
Post ownership
Message actions

Do not repeatedly decode the JWT and issue a second user request just to build a profile URL.

4. Ensure the frontend handles the current backend profile response

File

lib/api.ts

Problem

The backend's current ProfileResponse contains:

{
  "user": {...},
  "stats": {...},
  "relationship": {...},
  "actions": {...},
  "privacy": {...}
}

The frontend type currently omits actions.

Required change

Add:

actions: {
  can_follow: boolean;
  can_message: boolean;
  is_self: boolean;
};

This should be used by the profile page instead of inferring those permissions from IDs.

5. Use backend actions for profile buttons

File

app/profile/[username]/page.tsx

Instead of only checking:

isOwnProfile

also use:

profile.actions.can_follow
profile.actions.can_message
profile.actions.is_self

Recommended UI:

Own profile:
[ Edit profile ]

Other public profile:
[ Follow/Following ] [ Message ]

Other private profile:
[ Follow ] [ Message ]
+ private-profile explanation

Do not hide Message merely because the user is not already following the target.

The backend explicitly supports messaging another user.

6. Fix the direct media-upload flow

File

lib/api.ts

Current frontend behavior

The latest createPostWithMedia() creates a FormData object and sends:

POST /posts/
Content-Type: multipart/form-data

fields:
title
content
published
community_id
image
video

That is the correct frontend design.

Problem

The current backend POST /posts/ still expects a JSON PostCreate body.

Therefore the frontend multipart request does not match the backend route contract.

The backend must be changed to accept multipart form fields and optional UploadFile values.

Do NOT change the frontend back to URL inputs.

7. Keep Content-Type unset for multipart requests

The request() helper correctly avoids setting JSON content type when json: false.

Keep this behavior.

Do NOT manually add:

Content-Type: multipart/form-data

in JavaScript.

The browser must generate the boundary automatically.

8. Fix frontend Post type for uploaded media

Current problem

The backend now exposes:

media: PostMediaOut[]

inside the post object.

But the frontend PostEntity still mainly relies on:

image_url?
video_url?

Required change

Add:

type PostMedia = {
  id: number;
  url: string;
  media_type: "image" | "video" | string;
  mime_type: string;
  size_bytes: number;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
};

Then:

media?: PostMedia[];

inside PostEntity.

9. Render post.media, not only legacy URL fields

File

app/components/PostCard.tsx

The latest backend's durable uploaded media is represented by:

Post.media[]

Do not rely only on:

image_url
video_url

Required rendering

For every media item:

const mediaUrl = resolveApiUrl(media.url);

Then:

media.media_type === "image"

renders an image, and:

media.media_type === "video"

renders a video.

Continue supporting legacy image_url and video_url for existing posts during migration.

Recommended precedence:

Post.media
↓
legacy image_url/video_url

10. Fix the profile Media tab — current code has a response-shape bug

File

app/profile/[username]/page.tsx

The current code does this conceptually:

const request = activeTab === "media"
  ? getProfileMedia(username)
  : ...

request.then((result) =>
  setTabPosts(result as Awaited<ReturnType<typeof getProfilePosts>>)
)

This is incorrect.

getProfileMedia() returns PostMediaOut[].

getProfilePosts() returns PostWithVotes[].

These are different objects.

The current cast hides the bug from TypeScript but cannot make the runtime data compatible.

Required fix

Use separate state:

const [media, setMedia] = useState<PostMedia[]>([]);
const [tabPosts, setTabPosts] = useState<PostWithVotes[]>([]);

Then:

if (activeTab === "media") {
  setMedia(result as PostMedia[]);
}

and render the Media tab as a media grid/gallery, not as PostCard objects.

Example:

[ image ] [ image ] [ video ]
[ image ] [ video ] [ image ]

This is a confirmed frontend data-shape bug.

11. Fix profile Communities links

The latest profile page now correctly uses slug data when constructing community links.

Verify every community link uses:

href={`/communities/${encodeURIComponent(community.slug)}`}

with an explicit fallback only for legacy records:

community.slug || String(community.id)

But the preferred value is always slug.

12. Use the backend's slug endpoint exactly

Final frontend call:

export async function getCommunityBySlug(slug: string): Promise<Community> {
  return request<Community>(
    `/communities/by-slug/${encodeURIComponent(slug)}`,
    { method: "GET" },
    { auth: true, json: true }
  );
}

Do not use /communities/slug/....

13. Fix standard social sharing UI

The latest PostCard has the share sheet, which is good.

Improve the Share sheet to show:

Share post

[ Copy link ]
[ Share via device ]

Share to VoteFlow
[ avatar ] Karan Sharma   @karan_2
[ avatar ] Another user   @another

[ Send ]

Do not display:

Conversation 7

Use the conversation participant data now returned by the backend.

14. Use participant data when sharing into a DM

The latest frontend already receives other_user, last_message, and unread_count from conversations.

Use:

conversation.other_user

for the share dropdown label.

Fallback to participant only for backward compatibility.

15. Standardize shared-post rendering inside chat

The backend now supports:

shared_post_id
shared_post

in messages.

Add a message renderer:

{message.shared_post ? (
  <SharedPostCard post={message.shared_post} />
) : null}

Show:

Post title
Post preview
Author
Open post →

Do not render only:

Shared post #123

That is an implementation placeholder, not a standard social share card.

16. Add a real /post/[id] page

The share system generates:

/post/{postId}

The frontend must provide this route.

Create:

app/post/[id]/page.tsx

It should:

load the post from the canonical post endpoint;

render the same PostCard/post layout;

support media;

support replies;

support vote/share actions when authenticated.

Without this route, copied/shared links eventually land on a 404 page.

17. Fix image/video preview URL lifecycle

Composer.tsx currently uses:

URL.createObjectURL(file)

for preview.

Make sure object URLs are revoked after replacement/unmount:

URL.revokeObjectURL(url)

For multiple previews, store/revoke each generated URL.

This avoids accumulating browser blob URLs during repeated file selection.

18. Fix Failed to fetch user experience

A browser TypeError: Failed to fetch is not the real backend error message.

In request() keep distinguishing:

network failure
HTTP 4xx/5xx

For a true network failure:

try {
  const response = await fetch(...);
} catch {
  throw new ApiError(
    "Cannot reach VoteFlow API. Check the backend URL, CORS, and deployment status.",
    0
  );
}

This makes the actual deployment problem visible instead of showing a generic fetch error.

19. Verify production API URL

Vercel must contain:

NEXT_PUBLIC_API_URL=https://fastapi-management-system.onrender.com

After changing the environment variable, trigger a new Vercel deployment.

Do not rely on the fallback value during debugging.

20. Verify profile route with an authenticated user

Test exactly:

https://voteflow-phi.vercel.app/profile/<real-username>

In DevTools → Network verify:

GET https://fastapi-management-system.onrender.com/users/<real-username>/profile

Expected:

200

If:

404 User profile not found

the backend database does not contain that username.

If:

404 Not Found

the deployed backend does not have the route.

If:

403 This profile is private

the profile exists and the frontend must render the private-profile state.

21. Verify the production user data

The frontend should never invent usernames from email addresses.

Use the actual backend value:

user.username

Every newly registered user should receive a deterministic unique username.

22. Final frontend acceptance tests

Profiles

View my profile works.

View another public profile works.

Existing username with underscores works.

URL-encoded usernames work.

Private profile shows a private state.

Follow button works.

Message button works.

Followers list works.

Following list works.

Profile Communities links open correctly.

Posts

Text-only post works.

Image upload works.

Video upload works.

Image + video upload works if product rules allow both.

File preview works.

Removing a preview works.

Uploaded media appears after posting.

Existing legacy URL media still renders during migration.

Sharing

Share opens a real share sheet.

Copy link works.

Device share works when supported.

Share-to-DM shows people, not conversation IDs.

Shared post appears as a card in chat.

/post/{id} opens correctly.

Messaging

Other-user profile has Message button.

Message opens the correct 1-to-1 conversation.

Messages list shows avatar/name/username.

Latest message appears.

Unread count appears.

Chat header shows the other user.

Sender messages appear on the right.

Recipient messages appear on the left.

Communities

Community list links to slug URL.

Community detail loads by slug.

No invalid link message for valid communities.

Join state persists after reload.

Member can post with direct media upload.