import type { Json } from "../lib/net/rpcEnvelope"
import { demoInboxJson } from "./demoContent"

type Obj = Record<string, unknown>

const inbox: Obj[] = demoInboxJson.map((item) => ({ ...item }))
const memberMap: Record<number, Json[]> = {}
const inviteMap: Record<number, string> = {}
let nextChatId = 20
let nextMessageId = 1200
let nextUserId = 20

function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString()
}

function message(
  id: number,
  chatId: number,
  senderId: number,
  text: string,
  minutes: number,
): Json {
  return {
    id,
    chat_id: chatId,
    sender_id: senderId,
    message_type: "text",
    message_text: text,
    payload: {},
    file_id: "",
    reply_to_id: 0,
    is_deleted: false,
    created_at: ago(minutes),
  }
}

const messages: Record<number, Json[]> = {
  1: [
    message(1001, 1, 2, "Salom! Bugungi sprint tayyormi?", 36),
    message(1002, 1, 1, "Ha, 10 daqiqadan keyin boshlaymiz.", 18),
    message(1003, 1, 2, "Ertaga o'ynaymizmi?", 4),
  ],
  2: [
    message(1010, 2, 3, "Bugun hamma juda tez yozdi.", 58),
    message(1011, 2, 1, "Yangi rekord: 128 WPM!", 38),
  ],
  3: [message(1020, 3, 5, "Haftalik reyting yangilandi.", 180)],
}

function numberOf(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function textOf(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function chatFor(id: number): Json | null {
  const row = inbox.find((item) => item["chat_id"] === id)
  const chat = row?.["chat"]
  return typeof chat === "object" && chat !== null ? (chat as Json) : null
}

function members(): Json[] {
  return [
    { user_id: 1, username: "azizbek", display_name: "Azizbek", avatar_url: "", role: "creator", joined_at: ago(9000) },
    { user_id: 2, username: "dilnoza", display_name: "Dilnoza", avatar_url: "", role: "member", joined_at: ago(7000) },
  ]
}

export function demoChatCall(method: string, params: Json): Json | null {
  const chatId = numberOf(params["chat_id"])
  if (method === "chat.inbox") return { items: inbox }
  if (method === "chat.history") {
    return { items: [...(messages[chatId] ?? [])].reverse() }
  }
  if (method === "chat.send") {
    const id = ++nextMessageId
    const text = textOf(params["text"])
    const item = message(id, chatId, 1, text, 0)
    ;(messages[chatId] ??= []).push(item)
    const row = inbox.find((entry) => entry["chat_id"] === chatId)
    if (row) {
      row["last_message_id"] = id
      row["last_message_preview"] = text
      row["last_message_at"] = new Date().toISOString()
      row["last_sender_id"] = 1
    }
    return { message_id: id }
  }
  if (method === "chat.get") return chatFor(chatId) ?? {}
  if (method === "chat.members") return { items: memberMap[chatId] ?? (memberMap[chatId] = members()) }
  if (method === "chat.addMember") {
    const username = textOf(params["username"], "user")
    ;(memberMap[chatId] ??= members()).push({ user_id: ++nextUserId, username, display_name: username, avatar_url: "", role: "member", joined_at: ago(0) })
    return {}
  }
  if (method === "chat.removeMember") { memberMap[chatId] = (memberMap[chatId] ?? members()).filter((item) => item["user_id"] !== params["user_id"]); return {} }
  if (method === "chat.setRole") { const item = (memberMap[chatId] ??= members()).find((entry) => entry["user_id"] === params["user_id"]); if (item) item["role"] = params["role"]; return {} }
  if (method === "chat.update") { const chat = chatFor(chatId); if (chat) Object.assign(chat, params); return {} }
  if (method === "chat.inviteLink") { if (params["reset"] === true || !inviteMap[chatId]) inviteMap[chatId] = `https://keyra.app/join/${chatId}-${Math.random().toString(36).slice(2, 8)}`; return { invite_link: inviteMap[chatId] } }
  if (method === "chat.search") {
    const query = textOf(params["q"]).toLowerCase()
    const items = inbox
      .map((row) => row["chat"])
      .filter((chat): chat is Json => typeof chat === "object" && chat !== null)
      .filter((chat) => `${chat["title"]} ${chat["username"]}`.toLowerCase().includes(query))
    return { items }
  }
  if (method === "chat.create") {
    const id = ++nextChatId
    const type = textOf(params["type"], "group")
    const chat: Json = {
      id,
      type,
      title: textOf(params["title"], "New chat"),
      username: textOf(params["username"]),
      about: "",
      photo_url: "",
      is_public: params["is_public"] === true,
      creator_id: 1,
      member_count_cached: 1,
      created_at: new Date().toISOString(),
      peer_user_id: 0,
    }
    inbox.unshift({ chat_id: id, user_id: 1, role: "creator", joined_at: ago(0), last_message_id: 0, last_message_preview: "", last_message_type: "text", last_message_at: ago(0), last_sender_id: 0, last_read_message_id: 0, unread_count: 0, is_muted: false, is_pinned: false, chat })
    messages[id] = []
    return { chat_id: id }
  }
  if (["chat.read", "chat.join", "chat.addMember", "chat.removeMember", "chat.leave"].includes(method)) return {}
  return null
}
