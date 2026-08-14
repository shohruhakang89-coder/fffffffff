import { ArrowLeft, Hash, Phone, UserRound, UsersRound } from "lucide-react"
import { useState } from "react"
import type { Chat } from "../../models/chat"
import { useCallStore } from "../call/callStore"
import { ContactProfileSheet } from "./ContactProfileSheet"
import { MembersDialog } from "./MembersDialog"

export function ChatThreadHeader({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const [showMembers, setShowMembers] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const canCall = chat.type === "private" && chat.peer_user_id > 0
  const name = chat.title || chat.username || "Chat"
  const startCall = () => void useCallStore.getState().start(chat.peer_user_id, name)
  // Tapping the name/avatar opens the members panel for groups/channels, or the
  // read-only contact profile for a private chat.
  const openInfo = () => (chat.type === "private" ? setShowProfile(true) : setShowMembers(true))
  return (
    <>
      <header className="glass relative z-20 mx-3 mt-[max(env(safe-area-inset-top),40px)] flex h-[62px] shrink-0 items-center gap-2.5 rounded-[22px] px-2.5 sm:mx-4 lg:mt-4">
        <button onClick={onBack} aria-label="Back" className="glass-key pressable grid h-10 w-10 shrink-0 place-items-center rounded-full text-accent lg:hidden"><ArrowLeft className="h-5 w-5" /></button>
        <button onClick={openInfo} aria-label="Profilni ko'rish" className="glass-key pressable grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted">
          {chat.type === "private" ? <UserRound className="h-[18px] w-[18px]" /> : chat.type === "group" ? <UsersRound className="h-[18px] w-[18px]" /> : <Hash className="h-[18px] w-[18px]" />}
        </button>
        <button onClick={openInfo} className="min-w-0 flex-1 text-center lg:text-left"><span className="block truncate text-[15px] font-bold text-ink">{name}</span><span className="flex items-center justify-center gap-1 truncate text-[11px] text-muted lg:justify-start">{chat.type === "private" ? <><i className="h-1.5 w-1.5 rounded-full bg-mint" /> Onlayn</> : `${chat.member_count_cached} a'zo`}</span></button>
        {chat.type !== "private" && <button onClick={() => setShowMembers(true)} className="glass-key pressable grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted" title="A'zolar"><UsersRound className="h-[18px] w-[18px]" /></button>}
        {canCall && <button onClick={startCall} className="glass-key pressable grid h-10 w-10 shrink-0 place-items-center rounded-full text-accent" title="Ovozli qo'ng'iroq"><Phone className="h-[18px] w-[18px]" /></button>}
      </header>
      {showMembers && <MembersDialog chatId={chat.id} onClose={() => setShowMembers(false)} />}
      {showProfile && <ContactProfileSheet chat={chat} onClose={() => setShowProfile(false)} />}
    </>
  )
}
