# VoteFlow Frontend — Bugs Found and Fixed

**Repo:** `shravanvinayhegde/FastAPI-Social-Management-System-Frontend`
**Live site:** https://voteflow-phi.vercel.app/
**Stack:** Next.js 16.2.3 (App Router), React, TypeScript

## How this was verified

1. Installed the exact dependency versions from `package-lock.json` and ran `tsc --noEmit` before and after every change.
2. Reproduced the bug from your screenshots in isolation first: a throwaway route mirroring the exact pattern used in the real pages, confirming that reading `params.slug` synchronously resolves to `undefined` on Next.js 16, while `use(params)` resolves it correctly — verified with both an ASCII value and a Devanagari string, to make sure the fix isn't ASCII-only.
3. Ran the actual patched frontend against the actual patched backend together (dev servers on `localhost:3111` / `localhost:8000`), seeded a real user, community, and post through the API, and requested the real pages (`/profile/e2euser`, `/communities/zincs`, `/post/1`) end-to-end.
4. Confirmed no `params should be awaited` / Promise warnings appear in the Next.js dev server log after the fix (they do, reliably, before it).
5. Checked the exact JSON shape FastAPI actually returns for a 422 (not assumed) before fixing the error-message parsing, and unit-tested the parsing logic against that real payload in Node.

Diff stats: 9 files changed, 128 insertions, 41 deletions.

---

## Fixed and verified

### 1. The bug behind all three of your screenshots: route params read before they were ready

**Files:** `app/profile/[username]/page.tsx`, `app/communities/[slug]/page.tsx`, `app/post/[id]/page.tsx`, `app/messages/[conversationId]/page.tsx`

**What was happening:** In Next.js 16, a page's `params` prop is a `Promise`, not a plain object — a change from the Next 13–15 pattern this codebase was still using. All four dynamic route pages did:
```tsx
export default function UsernameProfilePage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);
```
Since `params` is actually a Promise, `params.username` is `undefined` (Promises don't have a `.username` property), and `decodeURIComponent(undefined)` returns the literal string `"undefined"`. So the app looked up a user named `"undefined"` and a community named `"undefined"` — every single time, for every profile and every community, regardless of which one you actually opened. The API correctly 404'd on that nonexistent name, and the page showed the hardcoded messages you saw: **"This user does not exist"** and **"Community not found"**. The same bug also broke every shared `/post/:id` link and every `/messages/:id` conversation thread — those would have shown a loading spinner forever or an invalid-link error instead of the actual content, for the identical reason.

**Fix**, applied identically to all four pages (shown here for the profile page):
```tsx
import { use, useEffect, useState } from "react";
...
export default function UsernameProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = use(params);
  const username = decodeURIComponent(rawUsername);
```

**Verified:**
- Isolated test: `use(params)` resolves to the real value (`"zincs"`, and separately `"मराठी"`) instead of the string `"undefined"`.
- `tsc --noEmit` is clean with the corrected `Promise<{...}>` prop types.
- End-to-end against the real backend: `curl http://localhost:3111/profile/e2euser` → HTTP 200, and — critically — Next's own server-rendered hydration payload shows `"params":{"username":"e2euser"}` correctly resolved (this is the exact internal value `use()` unwraps), where the broken version would have carried `undefined` through to the client fetch.
- The Next.js dev server log, which reliably logs a "params should be awaited" warning under the old code, shows none after the fix.

### 2. Vote counts drifted from the real count

**Files:** `app/components/PostCard.tsx`, `app/components/VoteRail.tsx`, `lib/api.ts`

**What was happening:** Voting is idempotent on the server — upvoting a post you've already upvoted, or removing a vote you never cast, changes nothing. But the frontend ignored the server's response entirely and always nudged the local count by ±1 on every click:
```tsx
await vote(postId, dir);
setCurrentVotes((prev) => (dir === 1 ? prev + 1 : Math.max(0, prev - 1)));
```
A double-click, a slow network causing a retry, or just clicking "Upvote" again after already upvoting would all silently drift the displayed count away from the true value, with no way to correct it short of a page refresh. Compounding this, `vote()`'s return type was mistyped as `{ message: string }`, when the backend actually returns `{ voted: boolean, vote_count: number }` — so the real count was sitting right there in the response and simply wasn't being read.

**Fix:** use the server's authoritative response instead of guessing:
```tsx
const status = await vote(postId, dir);
setCurrentVotes(status.vote_count);
setHasVoted(status.voted);
```
Also corrected `vote()`'s return type in `api.ts`, added a `voted` field end-to-end (`PostWithVotes.voted` → `PostCard`'s `voted` prop → `VoteRail`'s `hasVoted`), and gave the upvote button a highlighted state when `hasVoted` is true, so there's now a visible indicator of your own vote where none existed before.

**Verified:** `tsc --noEmit` clean across all touched files; confirmed the backend genuinely returns `{voted, vote_count}` (not `{message}`) by hitting the real, patched `/vote/` endpoint.

### 3. Validation errors showed as "Request failed (422 Unprocessable Entity)" instead of the actual problem

**File:** `lib/api.ts`

**What was happening:** FastAPI's built-in validation errors send `detail` as an **array** of `{loc, msg, type}` objects, not a plain string:
```json
{"detail":[{"type":"string_too_short","loc":["body","password"],"msg":"String should have at least 8 characters", ...}]}
```
(confirmed against the real, running backend, not assumed). The error handling only checked `typeof data?.detail === "string"`, so every validation error anywhere in the app — a short password at registration, a malformed email, a blank required field on any form — fell through to the generic `Request failed (422 Unprocessable Entity)`, hiding the one piece of information the person actually needed to fix their input.

**Fix:** a proper `extractErrorDetail()` helper that handles both shapes:
```ts
function extractErrorDetail(data, response): string {
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (item && typeof item === "object" && typeof item.msg === "string") {
        const loc = Array.isArray(item.loc) ? item.loc : [];
        const field = loc.filter((p) => p !== "body" && p !== "query" && p !== "path").join(".");
        return field ? `${field}: ${item.msg}` : item.msg;
      }
      return null;
    }).filter(Boolean);
    if (messages.length) return messages.join("; ");
  }
  return `Request failed (${response.status} ${response.statusText})`;
}
```
**Verified:** tested against the real payloads the backend returns for a short password and an invalid email — now surfaces `"password: String should have at least 8 characters"` and `"email: value is not a valid email address: ..."` respectively, and still handles the plain-string case (e.g. `"Email already registered"`) unchanged.

### 4. No way to log out on desktop, and the header's login state could go stale

**File:** `app/components/Header.tsx`

**What was happening:** two related bugs.
- The only logout control anywhere in the app was inside `BottomNav`, which is `md:hidden` (mobile only) **and** only ever rendered on the home page (`app/page.tsx`), so it wasn't reachable from a profile, community, conversation, or post page — and never on desktop at all, from anywhere.
- Separately, `Header` tracked its own `isAuthed` state via a one-time `getToken()` check in a `useEffect(() => {...}, [])` — empty dependency array, so it never ran again after the initial mount. `AuthProvider`'s `currentUser` does correctly refetch on every route change, but `Header` wasn't using it for this — so logging in or out anywhere other than a hard full-page reload could leave the header showing the wrong state (still "Sign in" after logging in, or still showing the signed-in view after logging out) until the next full reload happened to sync it back up.

**Fix:**
```tsx
// isAuthed now derives from AuthProvider's currentUser instead of a stale local check
const isAuthed = Boolean(user);
```
plus an actual logout button (reusing the existing `ConfirmModal` component, same confirm-before-logout pattern already used in `BottomNav`) added to both the desktop header and the mobile menu panel, so it's reachable from every page, on every screen size.

**Verified:** `tsc --noEmit` clean.

---

## Identified but not fixed (documented for follow-up)

These are real, reproducible issues I found during the audit but didn't have time to fix and verify to the same standard as the items above. Flagging them clearly rather than guessing at fixes I couldn't test:

| Issue | File(s) | Notes |
|---|---|---|
| Feed is capped at whatever's loaded (default 20 posts); "Top" sort only reorders those, never reaching older high-voted posts | `app/page.tsx` | The backend now supports `?sort=top` server-side (see backend report) — the frontend fix is to call it with real pagination instead of sorting client-side, which is a bigger change than a one-line patch. |
| Composer labels the title field "Title (optional)" but the backend rejects a blank title | `app/components/Composer.tsx` | Either the label is wrong or the intent was for title to truly be optional — needs a product decision, not just a code fix. |
| Search box doesn't re-run when already on the home page (effect depends only on `[router]`); also hidden on mobile | `app/page.tsx`, `app/components/SearchBar.tsx` | |
| Notifications show generic "Someone…" text and aren't clickable through to the relevant post/conversation | `app/notifications/page.tsx` | |
| Every request sends `Content-Type: application/json` even for GETs, forcing an unnecessary CORS preflight on every read | `lib/api.ts` | |
| Two nested `<main>` elements (`layout.tsx` and `page.tsx`) | `app/layout.tsx`, `app/page.tsx` | Cosmetic/accessibility, not functional. |
| Theme applies after page load, causing a flash | `app/components/ThemeToggle.tsx` | |
| `createPost()` in `lib/api.ts` sends JSON to an endpoint that expects form data | `lib/api.ts` | Currently unused dead code, so no live impact, but would break if wired up. |

## How to re-verify

```bash
npm ci
npx tsc --noEmit          # should be clean
npm run dev                # point NEXT_PUBLIC_API_URL at a running backend and click through
#  - /profile/<a real username>
#  - /communities/<a real slug>
#  - /post/<a real id>
#  - /messages/<a real conversation id>
# all four should load real content instead of "not found" / stuck loading
```
