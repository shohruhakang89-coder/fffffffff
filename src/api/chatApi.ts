import { rpc } from "../store/client"
import {
  chatFromJson,
  chatMemberFromJson,
  chatMessageFromJson,
  type Chat,
  type ChatMember,
  type ChatMemberInfo,
  type ChatMessage,
} from "../models/chat"

function listOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export const chatApi = {
  inbox: async (cursor = "", limit = 20): Promise<ChatMember[]> => {
    const res = await rpc.call("chat.inbox", { cursor, limit })
    return listOf(res["items"])
      .map(chatMemberFromJson)
      .filter((item): item is ChatMember => item !== null)
  },
  history: async (chatId: number, beforeId = 0, limit = 40): Promise<ChatMessage[]> => {
    const res = await rpc.call("chat.history", {
      chat_id: chatId,
      before_id: beforeId,
      limit,
    })
    return listOf(res["items"])
      .map(chatMessageFromJson)
      .filter((item): item is ChatMessage => item !== null)
  },
  send: async (chatId: number, type: string, text: string, payload = {}) => {
    const res = await rpc.call("chat.send", { chat_id: chatId, type, text, payload })
    return Number(res["message_id"] ?? 0)
  },
  read: async (chatId: number, messageId: number) => {
    await rpc.call("chat.read", { chat_id: chatId, message_id: messageId })
  },
  search: async (q: string, limit = 30): Promise<Chat[]> => {
    const res = await rpc.call("chat.search", { q, limit, offset: 0 })
    return listOf(res["items"]).map(chatFromJson).filter((chat) => chat.id > 0)
  },
  create: async (type: string, title: string, username = "", isPublic = false) => {
    const res = await rpc.call("chat.create", {
      type,
      title,
      username,
      is_public: isPublic,
    })
    return Number(res["chat_id"] ?? 0)
  },
  join: async (chatId: number) => {
    await rpc.call("chat.join", { chat_id: chatId })
  },
  get: async (chatId: number): Promise<Chat> => {
    const res = await rpc.call("chat.get", { chat_id: chatId })
    return chatFromJson(res["chat"] ?? res)
  },
  members: async (chatId: number, limit = 100): Promise<ChatMemberInfo[]> => {
    const res = await rpc.call("chat.members", { chat_id: chatId, limit })
    return listOf(res["items"]) as ChatMemberInfo[]
  },
  addMember: async (chatId: number, username: string, role = "member") => {
    await rpc.call("chat.addMember", { chat_id: chatId, username, role })
  },
  removeMember: async (chatId: number, userId: number) => {
    await rpc.call("chat.removeMember", { chat_id: chatId, user_id: userId })
  },
  setRole: async (chatId: number, userId: number, role: "member" | "admin") => {
    await rpc.call("chat.setRole", { chat_id: chatId, user_id: userId, role })
  },
  update: async (chatId: number, patch: Record<string, unknown>) => {
    await rpc.call("chat.update", { chat_id: chatId, ...patch })
  },
  inviteLink: async (chatId: number, reset = false): Promise<string> => {
    const res = await rpc.call("chat.inviteLink", { chat_id: chatId, reset })
    return String(res["invite_link"] ?? "")
  },
  leave: async (chatId: number) => {
    await rpc.call("chat.leave", { chat_id: chatId })
  },
}
