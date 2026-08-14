import { create } from "zustand"
import { chatApi } from "../api/chatApi"
import { rpc } from "./client"
import type { ChatMember, ChatMessage } from "../models/chat"

interface ChatStore {
  inbox: ChatMember[]
  loading: boolean
  loadInbox: () => Promise<void>
  addInboxItem: (item: ChatMember) => void
  updateInboxFromEvent: (event: any) => void
}

export const useChatStore = create<ChatStore>((set, get) => {
  // Listen to RPC events
  rpc.onEvent((payload) => {
    get().updateInboxFromEvent(payload)
  })

  return {
    inbox: [],
    loading: false,

    loadInbox: async () => {
      set({ loading: true })
      try {
        const items = await chatApi.inbox()
        set({ inbox: items, loading: false })
      } catch (err) {
        set({ loading: false })
      }
    },

    addInboxItem: (item) => {
      set((state) => {
        const filtered = state.inbox.filter((m) => m.chat_id !== item.chat_id)
        return { inbox: [item, ...filtered] }
      })
    },

    updateInboxFromEvent: (payload) => {
      const eventName = payload["event"]
      const data = payload["payload"]
      if (!data) return

      if (eventName === "chat.message") {
        const chatId = data.chat_id
        const msgId = data.message_id
        const text = data.text
        const type = data.type
        const senderId = data.sender_id

        set((state) => {
          const inbox = [...state.inbox]
          const idx = inbox.findIndex((m) => m.chat_id === chatId)
          if (idx >= 0) {
            const item = { ...inbox[idx] }
            item.last_message_id = msgId
            item.last_message_at = new Date().toISOString()
            item.last_message_preview = type === "text" ? text.substring(0, 140) : `[${type}]`
            item.last_sender_id = senderId
            item.last_message_type = type
            // Bump unread if it wasn't us
            const authState = (window as any).__AUTH_STATE // Hacky but we can just rely on the UI calling markAsRead when open
            inbox.splice(idx, 1)
            inbox.unshift(item)
            return { inbox }
          } else {
            // Need to fetch full chat info if not in inbox. Fire and forget
            chatApi.get(chatId).then(chat => {
              const item: ChatMember = {
                chat_id: chatId,
                user_id: 0,
                role: "member",
                joined_at: new Date().toISOString(),
                last_message_id: msgId,
                last_message_preview: type === "text" ? text.substring(0, 140) : `[${type}]`,
                last_message_type: type,
                last_message_at: new Date().toISOString(),
                last_sender_id: senderId,
                last_read_message_id: 0,
                unread_count: 1,
                is_muted: false,
                is_pinned: false,
                chat: chat
              }
              get().addInboxItem(item)
            }).catch(() => {})
          }
          return state
        })
      }
    }
  }
})
