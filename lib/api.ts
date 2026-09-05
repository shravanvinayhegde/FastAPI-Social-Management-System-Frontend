export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://fastapi-management-system.onrender.com";

const TOKEN_KEY = "token";
const LEGACY_TOKEN_KEY = "access_token";

type JsonRecord = Record<string, unknown>;

export type AuthToken = {
  access_token: string;
  token_type: string;
};

export type UserOut = {
  id: number;
  email: string;
  created_at: string;
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  profile_visibility?: "public" | "private" | string | null;
  show_posts?: boolean;
  show_communities?: boolean;
};

export type FollowStatus = {
  following: boolean;
  follower_count: number;
  following_count: number;
};

export type Community = {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  creator_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  member_count?: number;
  is_member?: boolean;
};

export type ProfileResponse = {
  user: {
    id: number;
    username: string;
    display_name: string;
    bio: string | null;
    avatar_url: string;
    created_at: string;
  };
  stats: { followers: number; following: number; posts: number; communities: number };
  relationship: { is_following: boolean; is_followed_by: boolean };
  privacy: { visibility: string; show_posts: boolean; show_communities: boolean };
};

export type ProfileUpdate = {
  display_name?: string;
  bio?: string | null;
  profile_visibility?: "public" | "private";
  show_posts?: boolean;
  show_communities?: boolean;
};

export type Reply = {
  id: number;
  content: string;
  post_id: number;
  owner_id: number;
  parent_id: number | null;
  created_at: string;
  owner?: UserOut | null;
};

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender?: UserOut | null;
};

export type Conversation = {
  id: number;
  user_one_id: number;
  user_two_id: number;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: number;
  recipient_id: number;
  actor_id: number | null;
  type: string;
  entity_type: string | null;
  entity_id: number | null;
  payload: string;
  is_read: boolean;
  created_at: string;
};

export type PostEntity = {
  id: number;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  owner_id: number;
  owner: UserOut;
  community_id?: number | null;
  image_url?: string | null;
  video_url?: string | null;
};

export type PostWithVotes = {
  Post: PostEntity;
  votes: number;
};

export type ShareResult = { post_id: number; shared: boolean; share_count: number };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  json?: boolean;
  auth?: boolean;
};

function buildUrl(path: string): string {
  const base = API_URL.replace(/\/$/, "");
  const route = path.startsWith("/") ? path : `/${path}`;
  return `${base}${route}`;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function getCurrentUserId(): number | null {
  const token = getToken();
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const payload = JSON.parse(json) as { user_id?: number | string; id?: number | string };
    const rawId = payload.user_id ?? payload.id;
    const parsed = typeof rawId === "string" ? Number(rawId) : rawId;
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
}

export function logout(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = { json: true, auth: false }
): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  if (options.json !== false && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  const data = (await parseJsonSafe(response)) as JsonRecord | null;

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : `Request failed (${response.status} ${response.statusText})`;
    if (response.status === 401) {
      logout();
    }
    throw new ApiError(detail, response.status);
  }

  return data as T;
}

export async function login(email: string, password: string): Promise<AuthToken> {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);

  const data = await request<AuthToken>(
    "/login",
    {
      method: "POST",
      body: form,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    { json: false, auth: false }
  );

  if (!data.access_token) {
    throw new Error("Login response did not include access_token.");
  }

  setToken(data.access_token);
  return data;
}

export async function registerUser(email: string, password: string): Promise<UserOut> {
  return request<UserOut>("/users/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export type GetPostsOptions = { limit?: number; skip?: number; search?: string };

export async function getPosts(options: GetPostsOptions = {}): Promise<PostWithVotes[]> {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  if (options.skip !== undefined) params.set("skip", String(options.skip));
  if (options.search) params.set("search", options.search);

  const query = params.toString();
  const path = query ? `/posts/?${query}` : "/posts/";
  return request<PostWithVotes[]>(path, { method: "GET" }, { auth: true, json: true });
}

export async function sharePost(postId: number): Promise<ShareResult> {
  return request<ShareResult>(`/posts/${postId}/share`, { method: "POST" }, { auth: true, json: true });
}

export async function createPost(
  title: string,
  content: string,
  published = true,
  options: { community_id?: number | null; image_url?: string | null; video_url?: string | null } = {}
): Promise<PostEntity> {
  return request<PostEntity>(
    "/posts/",
    {
      method: "POST",
      body: JSON.stringify({ title, content, published, ...options }),
    },
    { auth: true, json: true }
  );
}

export async function updatePost(
  postId: number,
  title: string,
  content: string,
  published = true
): Promise<PostEntity> {
  return request<PostEntity>(
    `/posts/${postId}`,
    {
      method: "PUT",
      body: JSON.stringify({ title, content, published }),
    },
    { auth: true, json: true }
  );
}

export async function getFollowStatus(userId: number): Promise<FollowStatus> {
  return request<FollowStatus>(`/users/${userId}/follow-status`, { method: "GET" }, { auth: true, json: true });
}

export async function followUser(userId: number): Promise<FollowStatus> {
  return request<FollowStatus>(`/users/${userId}/follow`, { method: "POST" }, { auth: true, json: true });
}

export async function unfollowUser(userId: number): Promise<FollowStatus> {
  return request<FollowStatus>(`/users/${userId}/follow`, { method: "DELETE" }, { auth: true, json: true });
}

export type GetUsersOptions = { skip?: number; limit?: number };

export async function getFollowers(userId: number, options: GetUsersOptions = {}): Promise<UserOut[]> {
  return getUsers(`/users/${userId}/followers`, options);
}

export async function getFollowing(userId: number, options: GetUsersOptions = {}): Promise<UserOut[]> {
  return getUsers(`/users/${userId}/following`, options);
}

async function getUsers(path: string, options: GetUsersOptions): Promise<UserOut[]> {
  const params = new URLSearchParams();
  if (options.skip !== undefined) params.set("skip", String(options.skip));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  return request<UserOut[]>(`${path}?${params.toString()}`, { method: "GET" }, { auth: true, json: true });
}

export async function getReplies(postId: number): Promise<Reply[]> {
  return request<Reply[]>(`/posts/${postId}/replies`, { method: "GET" }, { auth: true, json: true });
}

export async function createReply(postId: number, content: string, parentId: number | null = null): Promise<Reply> {
  return request<Reply>(
    `/posts/${postId}/replies`,
    { method: "POST", body: JSON.stringify({ content, parent_id: parentId }) },
    { auth: true, json: true }
  );
}

export async function updateReply(replyId: number, content: string, parentId: number | null = null): Promise<Reply> {
  return request<Reply>(`/posts/replies/${replyId}`, { method: "PATCH", body: JSON.stringify({ content, parent_id: parentId }) }, { auth: true, json: true });
}

export async function deleteReply(replyId: number): Promise<void> {
  await request<unknown>(`/posts/replies/${replyId}`, { method: "DELETE" }, { auth: true, json: true });
}

export type GetCommunitiesOptions = { search?: string; skip?: number; limit?: number; sort?: string };

export async function getCommunities(options: GetCommunitiesOptions = {}): Promise<Community[]> {
  const params = new URLSearchParams();
  Object.entries(options).filter(([key]) => key !== "sort").forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return request<Community[]>(`/communities/${query ? `?${query}` : ""}`, { method: "GET" }, { auth: true, json: true });
}

export async function getCommunity(communityId: number): Promise<Community> {
  return request<Community>(`/communities/${communityId}`, { method: "GET" }, { auth: true, json: true });
}

export async function createCommunity(name: string, description: string): Promise<Community> {
  return request<Community>("/communities/", { method: "POST", body: JSON.stringify({ name, description }) }, { auth: true, json: true });
}

export async function joinCommunity(communityId: number): Promise<unknown> {
  return request<unknown>(`/communities/${communityId}/join`, { method: "POST" }, { auth: true, json: true });
}

export async function leaveCommunity(communityId: number): Promise<unknown> {
  return request<unknown>(`/communities/${communityId}/join`, { method: "DELETE" }, { auth: true, json: true });
}

export async function getCommunityPosts(communityId: number, options: GetPostsOptions & { sort?: string } = {}): Promise<PostWithVotes[]> {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return request<PostWithVotes[]>(`/communities/${communityId}/posts${query ? `?${query}` : ""}`, { method: "GET" }, { auth: true, json: true });
}

export async function getProfile(username: string): Promise<ProfileResponse> {
  return request<ProfileResponse>(`/users/${encodeURIComponent(username)}/profile`, { method: "GET" }, { auth: false, json: true });
}

export async function getProfilePosts(username: string, options: GetUsersOptions = {}): Promise<PostWithVotes[]> {
  const params = new URLSearchParams();
  if (options.skip !== undefined) params.set("skip", String(options.skip));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  return request<PostWithVotes[]>(`/users/${encodeURIComponent(username)}/posts?${params.toString()}`, { method: "GET" }, { auth: false, json: true });
}

export async function getProfileFollowers(username: string, options: GetUsersOptions = {}): Promise<UserOut[]> {
  return getProfileUsers(username, "followers", options);
}

export async function getProfileFollowing(username: string, options: GetUsersOptions = {}): Promise<UserOut[]> {
  return getProfileUsers(username, "following", options);
}

async function getProfileUsers(username: string, relation: "followers" | "following", options: GetUsersOptions): Promise<UserOut[]> {
  const params = new URLSearchParams();
  if (options.skip !== undefined) params.set("skip", String(options.skip));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  return request<UserOut[]>(`/users/${encodeURIComponent(username)}/${relation}?${params.toString()}`, { method: "GET" }, { auth: false, json: true });
}

export async function getProfileCommunities(username: string, options: GetUsersOptions = {}): Promise<Community[]> {
  const params = new URLSearchParams();
  if (options.skip !== undefined) params.set("skip", String(options.skip));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  return request<Community[]>(`/users/${encodeURIComponent(username)}/communities?${params.toString()}`, { method: "GET" }, { auth: false, json: true });
}

export async function updateMyProfile(update: ProfileUpdate): Promise<UserOut> {
  return request<UserOut>("/users/me/profile", { method: "PATCH", body: JSON.stringify(update) }, { auth: true, json: true });
}

export async function uploadAvatar(file: File): Promise<ProfileResponse> {
  const body = new FormData();
  body.append("file", file);
  return request<ProfileResponse>("/users/me/avatar", { method: "POST", body }, { auth: true, json: false });
}

export async function deleteAvatar(): Promise<ProfileResponse> {
  return request<ProfileResponse>("/users/me/avatar", { method: "DELETE" }, { auth: true, json: true });
}

export async function getMyCommunities(options: GetUsersOptions = {}): Promise<Community[]> {
  const params = new URLSearchParams();
  if (options.skip !== undefined) params.set("skip", String(options.skip));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  return request<Community[]>(`/users/me/communities?${params.toString()}`, { method: "GET" }, { auth: true, json: true });
}

export async function getCommunityMembers(communityId: number, options: GetUsersOptions = {}): Promise<UserOut[]> {
  const params = new URLSearchParams();
  if (options.skip !== undefined) params.set("skip", String(options.skip));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  return request<UserOut[]>(`/communities/${communityId}/members?${params.toString()}`, { method: "GET" }, { auth: false, json: true });
}

export async function getConversations(): Promise<Conversation[]> {
  return request<Conversation[]>("/conversations", { method: "GET" }, { auth: true, json: true });
}

export async function createConversation(userId: number): Promise<Conversation> {
  return request<Conversation>("/conversations", { method: "POST", body: JSON.stringify({ user_id: userId }) }, { auth: true, json: true });
}

export async function getConversation(conversationId: number): Promise<Conversation> {
  return request<Conversation>(`/conversations/${conversationId}`, { method: "GET" }, { auth: true, json: true });
}

export async function getMessages(conversationId: number, options: GetUsersOptions = {}): Promise<Message[]> {
  const params = new URLSearchParams();
  if (options.skip !== undefined) params.set("skip", String(options.skip));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  return request<Message[]>(`/conversations/${conversationId}/messages?${params.toString()}`, { method: "GET" }, { auth: true, json: true });
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  return request<Message>(`/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ content }) }, { auth: true, json: true });
}

export async function updateMessage(messageId: number, content: string): Promise<Message> {
  return request<Message>(`/messages/${messageId}`, { method: "PATCH", body: JSON.stringify({ content }) }, { auth: true, json: true });
}

export async function deleteMessage(messageId: number): Promise<void> {
  await request<unknown>(`/messages/${messageId}`, { method: "DELETE" }, { auth: true, json: true });
}

export async function markConversationRead(conversationId: number): Promise<unknown> {
  return request<unknown>(`/conversations/${conversationId}/read`, { method: "POST" }, { auth: true, json: true });
}

export async function getNotifications(options: GetUsersOptions = {}): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (options.skip !== undefined) params.set("skip", String(options.skip));
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  return request<Notification[]>(`/notifications/${params.toString() ? `?${params.toString()}` : ""}`, { method: "GET" }, { auth: true, json: true });
}

export async function getUnreadNotificationCount(): Promise<number> {
  const data = await request<{ count?: number; unread_count?: number }>("/notifications/unread-count", { method: "GET" }, { auth: true, json: true });
  return data.count ?? data.unread_count ?? 0;
}

export async function markNotificationRead(notificationId: number): Promise<unknown> {
  return request<unknown>(`/notifications/${notificationId}/read`, { method: "POST" }, { auth: true, json: true });
}

export async function markAllNotificationsRead(): Promise<unknown> {
  return request<unknown>("/notifications/read-all", { method: "POST" }, { auth: true, json: true });
}

export async function deletePost(postId: number): Promise<void> {
  await request<unknown>(`/posts/${postId}`, { method: "DELETE" }, { auth: true, json: true });
}

export async function vote(postId: number, dir: 0 | 1): Promise<{ message: string }> {
  return request<{ message: string }>(
    "/vote/",
    {
      method: "POST",
      body: JSON.stringify({ post_id: postId, dir }),
    },
    { auth: true, json: true }
  );
}

export async function getUser(id: number): Promise<UserOut> {
  return request<UserOut>(`/users/${id}`, { method: "GET" }, { auth: true, json: true });
}

