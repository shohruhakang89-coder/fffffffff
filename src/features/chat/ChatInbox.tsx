import { Hash, Plus, Search, UserRound, UsersRound } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ChatMember } from "../../models/chat"
import { useAuthStore } from "../../store/authStore"
import { useChatStore } from "../../store/chatStore"
import { LiquidSearchBar } from "../../ui/LiquidSearchBar"
import { NewChatDialog } from "./NewChatDialog"

type Filter = "all" | "unread" | "groups"
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Barchasi" }, { id: "unread", label: "O‘qilmagan" }, { id: "groups", label: "Hamjamiyat" },
]
const COLORS = ["#007AFF", "#6E6E73", "#5E7A7F", "#8B6F47"]

function timeLabel(iso: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  if (date.toDateString() === new Date().toDateString()) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export function ChatInbox({ activeChatId, onSelect }: { activeChatId: number | null; onSelect: (member: ChatMember) => void }) {
  const inbox = useChatStore((store) => store.inbox)
  const loading = useChatStore((store) => store.loading)
  const loadInbox = useChatStore((store) => store.loadInbox)
  const me = useAuthStore((store) => store.user)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [showNew, setShowNew] = useState(false)
  useEffect(() => { void loadInbox() }, [loadInbox])

  const safeInbox = useMemo(() => inbox.filter((item) => item?.chat?.id > 0), [inbox])
  const filtered = safeInbox.filter((item) => {
    const matchesQuery = `${item.chat.title} ${item.chat.username}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === "all" || (filter === "unread" ? item.unread_count > 0 : item.chat.type !== "private")
    return matchesQuery && matchesFilter
  })
  const handleOpen = async (chatId: number) => {
    await loadInbox()
    const found = useChatStore.getState().inbox.find((item) => item.chat_id === chatId && item.chat)
    if (found) onSelect(found)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="px-4 pb-1.5 pt-[max(env(safe-area-inset-top),44px)] sm:px-5 lg:pt-5">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-extrabold tracking-ios text-ink sm:text-[32px]">Chats</h1>
          <button onClick={() => setShowNew(true)} className="glass-key pressable grid h-11 w-11 place-items-center rounded-full text-ink" title="New chat"><Plus className="h-5 w-5" /></button>
        </div>
        <LiquidSearchBar
          query={query}
          onQuery={setQuery}
          placeholder="Search"
          icon={<Search className="h-4 w-4 text-muted" />}
          className="mt-4"
        />
        <div className="liquid-soft mt-3.5 inline-flex gap-1 rounded-full p-1">
          {FILTERS.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={`rounded-full px-5 py-1.5 text-[12px] font-bold transition-all ${filter === item.id ? "bg-surface text-accent shadow-sm" : "text-muted"}`}>{item.label}</button>)}
        </div>
      </header>
      <div className="scroll-clean min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 pb-4 pt-2 sm:px-4">
        {loading && safeInbox.length === 0 ? <p className="px-3 py-8 text-[13px] text-muted">Loading...</p> : filtered.length === 0 ? <div className="liquid-card m-1 rounded-[18px] p-5 text-center text-[12px] text-muted">No conversations found.</div> : (
          filtered.map((member) => {
            const chat = member.chat
            const active = chat.id === activeChatId
            const color = COLORS[chat.id % COLORS.length]
            const mine = member.last_sender_id === me?.id
            return (
              <button key={member.chat_id} onClick={() => onSelect(member)} className={`liquid-card pressable flex min-h-[72px] w-full items-center gap-3.5 rounded-[20px] px-3.5 py-3 text-left ${active ? "ring-2 ring-accent/40" : ""}`}>
                <span className="glass-key relative grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ color }}>
                  {chat.type === "private" ? <UserRound className="h-5 w-5" /> : chat.type === "group" ? <UsersRound className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
                  {chat.type === "private" && <i className="absolute bottom-[3px] right-[3px] h-[11px] w-[11px] rounded-full bg-mint shadow-[0_0_0_2px_rgb(var(--keyra-surface-rgb)),0_0_6px_rgba(48,209,88,.6)]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold text-ink">{chat.title || chat.username || "Chat"}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-muted">{mine ? "You: " : ""}{member.last_message_preview || "Start a conversation"}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5 pl-1">
                  <span className="text-[11px] font-medium text-muted">{timeLabel(member.last_message_at)}</span>
                  {member.unread_count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white">{Math.min(member.unread_count, 99)}</span>}
                </span>
              </button>
            )
          })
        )}
      </div>
      <NewChatDialog open={showNew} onClose={() => setShowNew(false)} onOpen={handleOpen} />
    </div>
  )
}
