export interface Chat {
  id: number
  type: "private" | "group" | "channel"
  title: string
  username: string
  about: string
  photo_url: string
  is_public: boolean
  creator_id: number
  member_count_cached: number
  created_at: string
  peer_user_id: number
}

export interface ChatMember {
  chat_id: number
  user_id: number
  role: "member" | "admin" | "creator"
  joined_at: string
  last_message_id: number
  last_message_preview: string
  last_message_type: string
  last_message_at: string
  last_sender_id: number
  last_read_message_id: number
  unread_count: number
  is_muted: boolean
  is_pinned: boolean
  chat: Chat
}

export interface ChatMessage {
  id: number
  chat_id: number
  sender_id: number
  message_type: "text" | "photo" | "video" | "voice" | "file" | "system" | "call"
  message_text: string
  payload: Record<string, unknown>
  file_id: string
  reply_to_id: number
  is_deleted: boolean
  created_at: string
}

export type ChatRole = "member" | "admin" | "creator"
export type ChatPermission = "messages" | "media" | "links" | "members" | "info" | "pin"

export interface ChatMemberInfo {
  user_id: number
  username: string
  display_name: string
  avatar_url: string
  role: ChatRole
  joined_at: string
}

export interface ChatSettings {
  title: string
  about: string
  username: string
  is_public: boolean
  invite_link: string
  permissions: Record<ChatPermission, boolean>
}

type Obj = Record<string, unknown>
const obj = (value: unknown): Obj | null =>
  typeof value === "object" && value !== null ? (value as Obj) : null
const num = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback
const str = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback

export function chatFromJson(value: unknown): Chat {
  const row = obj(value) ?? {}
  const kind = str(row["type"], "private")
  return {
    id: num(row["id"]),
    type: kind === "group" || kind === "channel" ? kind : "private",
    title: str(row["title"]),
    username: str(row["username"]),
    about: str(row["about"]),
    photo_url: str(row["photo_url"]),
    is_public: row["is_public"] === true,
    creator_id: num(row["creator_id"]),
    member_count_cached: num(row["member_count_cached"], 2),
    created_at: str(row["created_at"]),
    peer_user_id: num(row["peer_user_id"]),
  }
}

export function chatMemberFromJson(value: unknown): ChatMember | null {
  const root = obj(value)
  if (!root) return null
  const row = obj(root["member"]) ?? root
  const chatRaw = obj(row["chat"]) ?? obj(root["chat"]) ?? obj(root["conversation"])
  const inlineChat = typeof root["type"] === "string" ? root : null
  const chat = chatFromJson(chatRaw ?? inlineChat)
  const chatId = num(row["chat_id"], chat.id)
  if (chatId <= 0 || chat.id <= 0) return null
  return {
    chat_id: chatId,
    user_id: num(row["user_id"]),
    role: (str(row["role"], "member") as ChatMember["role"]),
    joined_at: str(row["joined_at"]),
    last_message_id: num(row["last_message_id"]),
    last_message_preview: str(row["last_message_preview"]),
    last_message_type: str(row["last_message_type"], "text"),
    last_message_at: str(row["last_message_at"]),
    last_sender_id: num(row["last_sender_id"]),
    last_read_message_id: num(row["last_read_message_id"]),
    unread_count: num(row["unread_count"]),
    is_muted: row["is_muted"] === true,
    is_pinned: row["is_pinned"] === true,
    chat,
  }
}

export function chatMessageFromJson(value: unknown): ChatMessage | null {
  const row = obj(value)
  if (!row || num(row["id"]) <= 0) return null
  return {
    id: num(row["id"]),
    chat_id: num(row["chat_id"]),
    sender_id: num(row["sender_id"]),
    message_type: str(row["message_type"], "text") as ChatMessage["message_type"],
    message_text: str(row["message_text"]),
    payload: obj(row["payload"]) ?? {},
    file_id: str(row["file_id"]),
    reply_to_id: num(row["reply_to_id"]),
    is_deleted: row["is_deleted"] === true,
    created_at: str(row["created_at"], new Date().toISOString()),
  }
}
