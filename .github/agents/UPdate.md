FastAPI Social Management System — Frontend Upgrade Specification
ROLE

You are a senior frontend engineer responsible for upgrading this existing Next.js + TypeScript frontend into a production-quality responsive social platform.

Frontend repository:

https://github.com/shravanvinayhegde/FastAPI-Social-Management-System-Frontend

Backend repository:

https://github.com/shravanvinayhegde/FastAPI-Management-System

The backend is the source of truth for API contracts and supported functionality.

Do NOT redesign the backend unless an actual frontend/backend contract mismatch is discovered.

First inspect the entire frontend codebase and the backend API/schema/router implementations before making changes.

1. PRIMARY OBJECTIVE

Bring the frontend into feature parity with the current backend.

The frontend must support:

authentication
user profiles
followers/following
posts
voting
replies/comments
nested replies
image/video post metadata
communities
community membership
community feeds
direct messages
real-time messaging
notifications
unread notification counts
responsive navigation
responsive layouts
loading states
error states
empty states
optimistic interactions where safe
reconnect handling for real-time features

The application should feel like a modern social platform rather than a CRUD dashboard.

2. DO NOT BREAK EXISTING FUNCTIONALITY

Before modifying code, preserve:

login
registration
JWT handling
logout
post creation
post editing
post deletion
post voting
dark/light theme
current visual identity
current API base URL configuration
Vercel deployment compatibility

Do not replace working functionality unnecessarily.

Prefer incremental refactoring over a complete rewrite.

3. BACKEND IS SOURCE OF TRUTH

Do not invent endpoints.

Inspect:

routers/auth.py
routers/user.py
routers/post.py
routers/vote.py
routers/community.py
routers/chat.py
routers/notification.py
app/models.py
app/schemas.py
app/main.py

The backend currently registers the community, chat, and notification routers in addition to the existing auth/user/post/vote routers.

Every frontend API function must match the actual backend:

HTTP method
path
request payload
authentication requirements
response structure
HTTP status handling

Never silently assume an endpoint exists.

4. API LAYER REFACTOR

The current lib/api.ts should become the central typed API client.

Do NOT scatter raw fetch() calls throughout components.

Create strongly typed API functions for every backend feature.

Recommended structure:

lib/
  api.ts
  types.ts
  auth.ts
  users.ts
  posts.ts
  communities.ts
  chat.ts
  notifications.ts
  websocket.ts

You may keep everything in api.ts if the existing architecture is intentionally kept simple, but feature separation is preferred.

Create TypeScript interfaces/types matching backend schemas exactly.

At minimum implement types for:

UserOut
PostEntity
PostWithVotes
FollowStatus
Community
Message
Conversation
Notification
Reply

Also support nullable values correctly.

For example:

community_id: number | null
image_url: string | null
video_url: string | null
parent_id: number | null
actor_id: number | null
entity_id: number | null

Do not use any to bypass typing.

5. USER PROFILE SYSTEM

The current profile is too basic.

Upgrade:

/u/[id]

into a complete social profile.

Profile header should contain:

email/user identity
joined date
follower count
following count
Follow / Following button
message button
profile actions
posts section

For the authenticated user's own profile:

Edit/profile actions where backend support exists
My Posts
Followers
Following
Communities

For another user's profile:

Follow/Unfollow
Message
Followers
Following
Posts

Use:

GET /users/{id}
GET /users/{id}/follow-status
POST /users/{id}/follow
DELETE /users/{id}/follow
GET /users/{id}/followers
GET /users/{id}/following

Follow and unfollow should update:

button state
follower count
following count where relevant

Do not require a complete page refresh.

Handle:

400 self-follow
404 user not found
409 already followed
404 follow relationship missing
401 expired authentication
6. FOLLOWERS / FOLLOWING UI

Create reusable components:

UserList
UserListItem
FollowButton
FollowStats
FollowersDialog
FollowingDialog

Each user item should support:

avatar/default avatar
email/name
Follow/Following state where applicable
profile navigation
message action where appropriate

Use pagination.

Backend supports:

skip
limit

Do not fetch unlimited users.

Implement progressive loading.

Show:

Loading skeleton
Empty followers state
Empty following state
API error state
7. POST SYSTEM UPGRADE

Posts must now support:

title
content
owner
votes
published
community
image URL
video URL
replies

The backend's post schema supports:

community_id
image_url
video_url

Update the composer accordingly.

The post creation UI should allow:

text-only post
optional image URL
optional video URL
optional community selection

Do not invent file-upload functionality unless the backend actually provides file upload support.

For URL media:

validate URLs on the frontend
display image previews safely
display video previews safely
gracefully handle broken media
never let media overflow the viewport
8. REPLIES / COMMENTS

Add a dedicated interaction area underneath every post.

Backend supports:

POST /posts/{post_id}/replies
GET /posts/{post_id}/replies

Support:

reply to post
reply to reply
nested reply display
loading replies
submit reply
empty replies
failed reply
retry
character counter
disabled submit when empty

The backend allows nested replies using parent_id.

Represent the frontend state as a tree where necessary.

Example:

Post
 ├── Reply A
 │    ├── Reply A1
 │    └── Reply A2
 └── Reply B

Prevent invalid parent relationships on the frontend.

When posting a reply:

trim whitespace
reject empty content
disable submit while sending
insert successfully-created reply immediately
avoid duplicate insertion

Never create fake replies locally without a successful backend response.

9. COMMUNITY SYSTEM

Create a dedicated community section.

Suggested routes:

/community
/community/[id]

or equivalent route structure consistent with the existing application.

Community discovery page should support:

list communities
search communities
create community
pagination
empty state

Backend supports:

POST /communities/
GET /communities/
GET /communities/{community_id}
POST /communities/{community_id}/join
DELETE /communities/{community_id}/join
GET /communities/{community_id}/members
GET /communities/{community_id}/posts

Support query parameters:

search
skip
limit
sort

Community page should contain:

Header
community name
description
creator
member information
Join / Leave button
Feed

Posts belonging to that community.

Sorting:

New
Top
Hot

Do not fake sorting in the browser if backend sorting is available.

Members

Paginated member list.

Create Post

When inside a community, the composer must automatically associate the post with that community.

The backend rejects community posting when the user is not a member, so handle:

403 Join the community before posting

with a useful UI message and a Join button.

10. MY COMMUNITIES

Use:

GET /users/me/communities

Create:

My Communities

in navigation/profile/dashboard.

Use pagination:

skip
limit

Display:

community name
description
joined state
open community action
11. DIRECT MESSAGING

Create:

/messages
/messages/[conversationId]

or an equivalent structure.

The backend supports conversations and messages.

Implement API functions for:

POST /conversations
GET /conversations
GET /conversations/{conversation_id}
GET /conversations/{conversation_id}/messages
POST /conversations/{conversation_id}/messages
POST /conversations/{conversation_id}/read

The user should be able to:

Open another user's profile.
Click Message.
Create/open the conversation.
Enter the conversation screen.
Load message history.
Send messages.
Receive new messages in real time.
12. CHAT UI

Desktop:

┌─────────────────────────────────────────────┐
│ Conversations │ Active Conversation         │
│               │                              │
│ User A        │ message                     │
│ User B        │       message               │
│ User C        │ message                     │
│               │                              │
│               │ [ message input ] [Send]    │
└─────────────────────────────────────────────┘

Mobile:

Do NOT attempt to keep both columns permanently visible.

Use:

Conversation list
       ↓
Active conversation
       ↓
Back button

The active conversation should occupy the full viewport width.

13. REAL-TIME WEBSOCKET MESSAGING

This is mandatory.

The backend contains a WebSocket connection manager and broadcasts new_message events to connected users.

The frontend must create a reusable WebSocket client.

Do not create a new WebSocket for every component render.

Create something similar to:

lib/websocket.ts

The connection must:

connect after authentication
authenticate according to the backend's WebSocket contract
receive JSON events
handle new_message
handle notification
reconnect automatically
avoid duplicate connections
close cleanly when logged out
reconnect after temporary network failure

Backend messaging events contain a structure equivalent to:

{
  "type": "new_message",
  "conversation_id": 123,
  "message": {
    ...
  }
}

The frontend must route an incoming message to the correct conversation.

If the active conversation is:

conversation_id === event.conversation_id

append the message immediately.

Otherwise:

update conversation preview
increment unread state
show notification/badge

Do not duplicate a message when:

POST returns the sent message.
WebSocket also delivers the same message.

Use message IDs for deduplication.

14. WEBSOCKET RECONNECTION

Implement resilient reconnection.

States:

connecting
connected
disconnected
reconnecting
failed

When disconnected:

show subtle connection state
don't destroy chat history
allow queued/retried UI behaviour where safe
reconnect with backoff
prevent infinite rapid reconnect loops

When reconnecting succeeds:

refresh conversation/messages as necessary
reconcile missed messages
deduplicate messages

Do not rely on WebSocket alone for durable message history.

HTTP GET history remains authoritative.

FastAPI supports WebSocket endpoints and disconnect handling; the frontend should therefore treat the WebSocket as a live event channel, not the database itself.

15. READ RECEIPT / READ STATE

When the user opens a conversation:

POST /conversations/{conversation_id}/read

Mark it read.

Do not mark messages read merely because they appeared in the conversation list.

Use visibility/focus appropriately.

When switching conversations:

load conversation
load messages
mark conversation read

Update unread state immediately after successful read.

16. NOTIFICATIONS

Create:

/notifications

and a reusable notification center/dropdown.

Backend provides:

GET /notifications/
GET /notifications/unread-count
POST /notifications/{notification_id}/read
POST /notifications/read-all

Display notification types generically.

Current backend notification records contain:

id
recipient_id
actor_id
type
entity_type
entity_id
payload
is_read
created_at

Do not hardcode a single notification format.

Create a notification renderer that can support future types.

Example UI:

🔔 Notifications
──────────────────
Shravan sent you a message
2 minutes ago

Someone followed you
10 minutes ago

New activity
1 hour ago

Unread notifications should be visually distinct.

17. REAL-TIME NOTIFICATIONS

The WebSocket also sends notification events.

When:

type === "notification"

immediately:

insert the notification
update unread count
show a subtle toast
update notification badge

Do not refresh the entire page.

Avoid duplicate notifications using notification IDs.

18. NAVIGATION SYSTEM

Upgrade the application shell.

Desktop:

Logo / Brand
Home
Community
Messages
Notifications
Profile
Theme
Logout

Mobile:

Use the existing BottomNav component, but make it the primary mobile navigation.

Suggested:

Home
Communities
Create
Messages
Notifications

Profile can be accessed from the top header/menu.

Navigation must not overflow horizontally.

19. RESPONSIVE DESIGN REQUIREMENTS

The application must behave like a standard production website.

Target:

320px+
375px
390px
430px
768px
1024px
1280px
1440px+

Do not design only for desktop and add one mobile breakpoint afterward.

Design mobile-first.

Required behaviour:

Mobile
single-column layouts
full-width cards
bottom navigation
compact headers
larger touch targets
dialogs become bottom sheets/full-screen where appropriate
chat becomes single-pane
community/member lists become single-column
no horizontal page scrolling
Tablet
adaptive content width
optional two-column areas
comfortable card spacing
Desktop
centered content container
readable max-width
optional sidebars
two-column messaging UI
larger information density

Use CSS media queries and the existing CSS architecture.

Do not introduce a massive CSS framework replacement unless necessary.

20. RESPONSIVE SPACING

Use a consistent spacing system.

Avoid arbitrary spacing everywhere.

Prefer reusable values/tokens.

Ensure:

page padding
card padding
section spacing
header height
bottom-nav safe area
dialog padding

remain consistent.

Pay special attention to mobile safe-area spacing.

21. MOBILE BOTTOM NAVIGATION

The bottom navigation must:

remain fixed
have safe-area padding
never cover page content
show active route
display unread badges
remain usable at 320px width

Main content should include enough bottom padding so the final element is not hidden behind navigation.

22. ACCESSIBILITY

Every interactive control must have:

accessible name
keyboard support
visible focus state
semantic HTML

Icon-only buttons require:

aria-label

Do not rely only on color to communicate:

unread
selected
followed
error
disabled

Dialogs must trap focus appropriately.

23. LOADING STATES

Do not display blank screens while API calls are running.

Create reusable:

Skeleton
PageLoader
ListSkeleton
PostSkeleton
MessageSkeleton
ProfileSkeleton
CommunitySkeleton

Use skeletons where content structure is known.

Use spinners only for short operations.

24. ERROR HANDLING

Every API screen needs a useful error state.

Handle:

400
401
403
404
409
422
429
500
network failure
timeout
backend waking up

For authentication errors:

clear invalid authentication
redirect to login where appropriate

For 403:

Show why the action is unavailable.

For 409:

Explain conflict instead of generic "something went wrong."

For network errors:

Provide a Retry button.

Do not expose raw backend stack traces.

25. RENDER FREEZE / RACE CONDITION PROTECTION

Prevent:

duplicate fetches
state updates after unmount
duplicate WebSocket listeners
duplicate messages
stale responses overwriting newer state
double-submit actions

Use:

AbortController where appropriate
request cancellation
stable effect dependencies
cleanup functions
message IDs
operation locks

Be especially careful in React Strict Mode.

26. OPTIMISTIC UI

Use optimistic updates only where rollback is straightforward.

Good candidates:

follow/unfollow button
voting
marking notification read

On failure:

rollback previous state
show error

For:

message creation
community creation
post creation
reply creation

prefer authoritative backend responses.

27. POST FEED IMPROVEMENTS

The current homepage should become a true social feed.

Keep:

FeedTabs
SearchBar
PostCard
Composer

but evolve them.

Posts should expose:

author
timestamp
title
content
media
vote
reply count/state
community
action menu
profile link

Clicking the author should navigate to:

/u/{userId}

Clicking community should navigate to its community page.

28. PROFILE POST LOADING

Do not load a global list of 50 posts and filter it in the browser as the long-term profile architecture.

The current profile implementation does this.

Replace it with a scalable backend-driven strategy where possible.

If the backend does not currently expose a dedicated user-post endpoint:

use the existing API carefully
add pagination support in the frontend
avoid loading unnecessary global data
do not pretend a missing endpoint exists

Do not modify backend solely to make frontend assumptions convenient unless the endpoint is genuinely required for scalability.

29. SEARCH

Existing post search should be preserved.

Extend the frontend search architecture so it can eventually support:

users
communities
posts

Do not make one giant component.

Use separate result sections/components.

Show:

No results
Searching...
Search error
30. STATE MANAGEMENT

Do not introduce Redux solely because the application is growing.

Start with:

React state
custom hooks
Context where global state is appropriate

Create reusable hooks such as:

useAuth()
useUser()
useFollow()
usePosts()
useReplies()
useCommunities()
useConversation()
useMessages()
useNotifications()
useWebSocket()

Keep server state separate from UI state.

31. CACHING / DATA REVALIDATION

Avoid unnecessarily refetching the same resource whenever navigating.

Where appropriate use a server-state solution already compatible with the project.

If adding a library, choose a lightweight established solution and use it consistently rather than mixing patterns.

Do not add multiple competing state/data-fetch libraries.

32. DATE/TIME DISPLAY

Backend timestamps contain datetime values.

Create a reusable formatter.

Display relative time where appropriate:

just now
2m
1h
Yesterday
Sep 5

Full timestamp can appear on hover/focus or detail views.

Handle invalid/missing timestamps safely.

33. EMPTY STATES

Every collection must have an intentional empty state.

Examples:

No posts yet
No followers yet
No following yet
No communities yet
You haven't joined any communities
No messages yet
No notifications
No replies yet

Never leave an empty white/blank container.

34. CONFIRMATION UX

Use confirmation dialogs for destructive actions:

deleting posts
leaving a community where appropriate

Do not use browser confirm() unless already required by the architecture.

Use the existing ConfirmModal component or improve it.

35. MEDIA SAFETY / UX

For image URLs:

loading="lazy"

where appropriate.

Prevent broken images from destroying layout.

Use fixed aspect-ratio containers.

For videos:

controls
responsive width
max-width: 100%
no overflow

Do not autoplay user-provided video.

36. PERFORMANCE

Prevent unnecessary rendering.

Especially optimize:

PostCard
reply tree
notification list
message list
community member list

Avoid:

fetch all → filter all → render all

for scalable data.

Use pagination.

Use keys based on stable IDs.

Do not use array indexes as keys for dynamic social content.

37. CHAT MESSAGE LIST PERFORMANCE

Messages can become large.

Do not render thousands of messages blindly.

Implement pagination.

Newest messages should appear naturally at the bottom.

When loading older messages:

preserve scroll position
prepend older messages
don't jump to bottom

When receiving a new message:

auto-scroll only when the user is already near the bottom
otherwise show "New messages" indicator
38. SECURITY

Frontend must never trust:

user IDs from local state
ownership checks
follow state
membership state
message permissions

The backend remains authoritative.

Frontend checks are for UX only.

Do not expose:

JWT secret
backend credentials
database credentials

Do not put secrets into NEXT_PUBLIC_*.

39. AUTHENTICATION EDGE CASES

Handle:

token missing
token malformed
token expired
token invalid
logout in another tab
API returns 401

Keep authentication handling centralized.

Do not decode JWT everywhere.

40. MULTI-TAB BEHAVIOUR

Use browser storage events where useful.

Examples:

logout in one tab should invalidate another tab
authentication changes should update navigation
theme should remain synchronized if current architecture supports it

Prevent two tabs from creating duplicated WebSocket connections unnecessarily within the same page lifecycle.

41. COMMUNITY EDGE CASES

Handle:

community does not exist
community name already exists
duplicate slug
already joined
already left
not a member
creator deleted/restricted
community with zero posts
community with zero members
long description
long name
special characters in names

The backend already validates community names and creates slugs.

Frontend validation should mirror constraints but never replace backend validation.

42. FOLLOW EDGE CASES

Handle:

self-follow
already following
already unfollowed
user deleted
rapid follow/unfollow clicks
network failure
stale follow state

Disable repeated clicks while request is in flight.

43. MESSAGING EDGE CASES

Handle:

self-message
unknown user
conversation no longer exists
user removed
message over 2000 characters
blank message
duplicate WebSocket event
WebSocket disconnected
server restart
network changes
multiple browser tabs
inactive tab
message sent but WebSocket unavailable
message returned twice
conversation list stale

HTTP remains authoritative.

44. NOTIFICATION EDGE CASES

Handle:

notification already read
notification not found
duplicate WebSocket notification
unread count mismatch
multiple notifications arriving rapidly
user viewing notification page while new notification arrives

Unread count should never become negative.

When marking all read:

count = 0

immediately after successful API response.

45. URL / ROUTING EDGE CASES

Handle:

/u/abc
/u/-1
/u/999999
/community/abc
/community/-1
/messages/unknown

Invalid IDs should produce proper UI states rather than runtime crashes.

46. MOBILE INPUT EDGE CASES

For message/reply/composer input:

prevent accidental submit when inappropriate
support mobile keyboard
keep input visible when keyboard opens
avoid viewport jumps
support long text
preserve draft while request is processing
disable submit during submission
47. DARK MODE

Preserve the existing theme system.

Every new component must work in:

dark
light

Do not introduce hardcoded colors that break theme consistency.

Use the existing design tokens wherever possible.

48. DESIGN LANGUAGE

Keep a consistent visual language:

rounded cards
restrained shadows
clean typography
consistent borders
modern spacing
subtle transitions
clear hierarchy
compact but readable social-feed layout

Avoid excessive:

glass effects
huge gradients
unnecessary animations
oversized headings
giant cards

The result should feel like a serious production product.

49. MOBILE DESIGN PRIORITY

Mobile should not look like a squeezed desktop version.

Examples:

Desktop post:

Avatar | Author
       | Title
       | Content
       | Media
       | Actions

Mobile:

Avatar Author
Title
Content
Media
Actions

Do not force fixed desktop widths.

50. COMPONENTIZATION

Create reusable components rather than enormous page files.

Suggested structure:

app/
  components/
    Avatar
    BottomNav
    Header
    PostCard
    PostComposer
    ReplyList
    ReplyComposer
    FollowButton
    FollowStats
    UserList
    CommunityCard
    CommunityHeader
    CommunityMemberList
    ConversationList
    ConversationItem
    ChatWindow
    MessageBubble
    MessageComposer
    NotificationCenter
    NotificationItem
    Skeletons
    EmptyState
    ErrorState

Do not create dozens of one-line components unnecessarily.

51. PAGE STRUCTURE

Recommended routes:

/
 /login
 /register
 /u/[id]

 /communities
 /communities/[id]

 /messages
 /messages/[conversationId]

 /notifications

Keep existing routes working.

Do not change route semantics unnecessarily.

52. FRONTEND API CONTRACT TESTING

For every new API integration verify:

Follow
GET follow status
POST follow
DELETE follow
GET followers
GET following
Communities
GET list
POST create
GET detail
POST join
DELETE leave
GET members
GET posts
GET my communities
Replies
GET replies
POST reply
POST nested reply
Messaging
POST conversation
GET conversations
GET conversation
GET messages
POST message
POST read
Notifications
GET notifications
GET unread-count
POST mark read
POST read-all
53. REAL-TIME TESTING

Test with at least two browser sessions.

Example:

Browser A = User 1
Browser B = User 2

Scenario:

User 1 opens User 2 profile.
User 1 starts conversation.
User 1 sends message.
User 2 receives message without refresh.
User 2 replies.
User 1 receives reply without refresh.
User 2 sees notification.
User 2 opens conversation.
Unread state becomes read.
Refresh both browsers.
Message history remains correct.

Also test:

WebSocket disconnect
reconnect
refresh during conversation
sending after reconnect
two tabs
54. RESPONSIVE TEST MATRIX

Verify at:

320 × 640
375 × 667
390 × 844
430 × 932
768 × 1024
1024 × 768
1280 × 720
1440 × 900
1920 × 1080

Check:

no horizontal scrollbar
no clipped buttons
no overlapping fixed navigation
no overflowing dialogs
no broken cards
no text collision
no inaccessible inputs
55. ACCEPTANCE CRITERIA

The implementation is complete only when:

Authentication
Login works
Register works
Logout works
expired auth handled
Social graph
profiles work
follow/unfollow works
counts update
followers list works
following list works
Posts
create works
edit works
delete works
voting works
media metadata works
community association works
Replies
replies load
replies can be created
nested replies work
loading/errors/empty states work
Communities
browse
search
create
join
leave
view members
view community posts
sort community posts
post inside community
Messaging
create/open conversation
conversation list
message history
send messages
read state
WebSocket real-time delivery
reconnect
Notifications
notification list
unread count
mark one read
mark all read
real-time notification arrival
Responsive
mobile
tablet
desktop
Quality
TypeScript clean
no unnecessary any
no console errors
no unhandled promises
no duplicate WebSocket connections
no broken navigation
no horizontal overflow
56. IMPLEMENTATION ORDER

Do the work in this order:

Phase 1 — Foundation
Audit existing frontend.
Refactor API/types.
Improve authentication handling.
Improve global layout/navigation.
Establish responsive breakpoints.
Create reusable loading/error/empty components.
Phase 2 — User graph
Profile
Follow status
Follow/unfollow
Followers
Following
User lists
Phase 3 — Posts
Media fields
Better PostCard
Replies
Nested replies
Better pagination
Phase 4 — Communities
Community discovery
Create community
Community detail
Join/leave
Members
Community posts
Community sorting
My communities
Phase 5 — Notifications
Notification API
Notification page
Bell
unread count
mark read
mark all read
Phase 6 — Messaging
Conversations
Message history
Message composer
Read state
WebSocket client
Reconnection
Event routing
Duplicate prevention
Mobile chat UX
Phase 7 — Polish
Loading skeletons
Responsive refinement
accessibility
performance
error handling
edge cases
production testing
57. IMPORTANT IMPLEMENTATION RULES

Do not:

rewrite the entire application without need
invent unsupported backend endpoints
duplicate API logic inside components
store server state in random component state unnecessarily
use browser alerts for normal UX
ignore 401/403/409 responses
rely exclusively on WebSockets for persistent data
create multiple WebSocket connections from multiple components
create optimistic updates that cannot be rolled back
use array indexes as keys
introduce horizontal scrolling
sacrifice mobile UX for desktop layout

Do:

keep API types synchronized with backend schemas
keep backend as authority
make every major interaction resilient to failure
use reusable hooks/components
use pagination
use stable IDs
support dark/light mode
test real-time features with multiple sessions
verify the production build after changes
FINAL GOAL

Transform the current VoteFlow frontend from:

Auth
Posts
Votes
Basic Profile

into:

                    ┌───────────────┐
                    │     USER      │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
     FOLLOW              COMMUNITIES          POSTS
        │                   │                   │
 Followers              Members              Votes
 Following              Community Feed       Replies
 Profile                Join/Leave           Media
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
                  DMs          Notifications
                    │                │
                WebSocket        Real-time
                Messages          Updates

The final UI must be responsive, accessible, visually consistent, resilient to network/API failures, and suitable for deployment on Vercel with the existing FastAPI backend on Render.

Do not consider the task complete merely because pages exist.

Consider it complete only when the frontend actually consumes the backend functionality correctly and the complete user flows work end-to-e