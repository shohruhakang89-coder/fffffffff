import { Hash, Search, Users, X } from "lucide-react"
import { useState, type ReactNode } from "react"
import { chatApi } from "../../api/chatApi"
import type { Chat } from "../../models/chat"
import { CreatePanel } from "./CreatePanel"
import { DiscoverPanel } from "./DiscoverPanel"

type Mode = "discover" | "group" | "channel"
const TABS: { id: Mode; label: string; icon: ReactNode }[] = [
  { id: "discover", label: "Discover", icon: <Search className="h-3.5 w-3.5" /> },
  { id: "group", label: "Group", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "channel", label: "Channel", icon: <Hash className="h-3.5 w-3.5" /> },
]

export function NewChatDialog({ open, onClose, onOpen }: { open: boolean; onClose: () => void; onOpen: (chatId: number) => void }) {
  const [mode, setMode] = useState<Mode>("discover")
  const [busy, setBusy] = useState(false)
  if (!open) return null
  const create = async (title: string, username: string, isPublic: boolean) => {
    if (!title.trim()) return
    setBusy(true)
    try { onOpen(await chatApi.create(mode, title.trim(), username.trim(), isPublic)); onClose() }
    finally { setBusy(false) }
  }
  const join = async (chat: Chat) => {
    setBusy(true)
    try { await chatApi.join(chat.id); onOpen(chat.id); onClose() }
    finally { setBusy(false) }
  }
  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/40 backdrop-blur-xl sm:items-center sm:p-4" onClick={onClose}>
      <div className="liquid-card w-full max-w-md rounded-b-none p-4 sm:rounded-[24px] sm:p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line/70 sm:hidden" />
        <div className="mb-3.5 flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-accent">Yangi aloqa</p><h2 className="text-lg font-bold tracking-ios text-ink">Suhbat yaratish</h2></div><button onClick={onClose} className="icon-btn pressable grid h-8 w-8 place-items-center rounded-full"><X className="h-3.5 w-3.5" /></button></div>
        <div className="liquid-control mb-3.5 flex gap-1 rounded-[13px] p-1">
          {TABS.map((tab) => <button key={tab.id} onClick={() => setMode(tab.id)} className={`flex flex-1 items-center justify-center gap-1 rounded-[10px] py-1.5 text-[10px] font-semibold ${mode === tab.id ? "bg-surface text-ink shadow-sm" : "text-muted"}`}>{tab.icon}{tab.label}</button>)}
        </div>
        {mode === "discover" ? <DiscoverPanel busy={busy} onJoin={join} /> : <CreatePanel busy={busy} onCreate={create} />}
      </div>
    </div>
  )
}
