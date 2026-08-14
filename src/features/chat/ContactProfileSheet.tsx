import { AtSign, BellOff, Info, Phone, Search, UserRound, X } from "lucide-react"
import type { Chat } from "../../models/chat"
import { useCallStore } from "../call/callStore"

// A read-only profile sheet for the person (or channel) you're chatting with.
// Everything is built from the Chat we already hold — no extra RPC — so it opens
// instantly from the thread header. Matches the frosted "liquid glass" sheet
// style used elsewhere (MembersDialog).
export function ContactProfileSheet({ chat, onClose }: { chat: Chat; onClose: () => void }) {
  const name = chat.title || chat.username || "Suhbat"
  const canCall = chat.type === "private" && chat.peer_user_id > 0
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?"
  const startCall = () => { void useCallStore.getState().start(chat.peer_user_id, name); onClose() }
  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/40 backdrop-blur-xl sm:items-center sm:p-4" onClick={onClose}>
      <div className="liquid-card max-h-[92dvh] w-full max-w-md overflow-hidden rounded-b-none p-0 sm:rounded-[26px]" onClick={(e) => e.stopPropagation()}>
        {/* header / hero */}
        <div className="relative flex flex-col items-center px-5 pb-5 pt-7 text-center">
          <button onClick={onClose} aria-label="Yopish" className="icon-btn absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full"><X className="h-4 w-4" /></button>
          {chat.photo_url ? (
            <img src={chat.photo_url} alt={name} className="h-24 w-24 rounded-[30px] object-cover shadow-float" />
          ) : (
            <div className="glass-key grid h-24 w-24 place-items-center rounded-[30px] text-[34px] font-extrabold text-accent">{initial}</div>
          )}
          <h2 className="mt-3 truncate text-[22px] font-extrabold tracking-ios text-ink">{name}</h2>
          {chat.username && <p className="mt-0.5 text-[12px] font-medium text-muted">@{chat.username}</p>}
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-1 text-[10px] font-bold text-mint">
            {chat.type === "private" ? <><i className="h-1.5 w-1.5 rounded-full bg-mint" /> Onlayn</> : `${chat.member_count_cached} a'zo`}
          </span>
        </div>

        {/* quick actions */}
        <div className="flex items-center justify-center gap-2.5 px-5 pb-4">
          {canCall && <ActionButton icon={<Phone className="h-[18px] w-[18px]" />} label="Qo'ng'iroq" onClick={startCall} />}
          <ActionButton icon={<Search className="h-[18px] w-[18px]" />} label="Qidirish" />
          <ActionButton icon={<BellOff className="h-[18px] w-[18px]" />} label="Ovozsiz" />
        </div>

        {/* details */}
        <div className="space-y-2.5 px-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
          {chat.about && <InfoRow icon={<Info className="h-4 w-4 text-accent" />} label="Bio" value={chat.about} />}
          {chat.username && <InfoRow icon={<AtSign className="h-4 w-4 text-accent" />} label="Username" value={`@${chat.username}`} />}
          <InfoRow icon={<UserRound className="h-4 w-4 text-accent" />} label="Turi" value={chat.type === "private" ? "Shaxsiy suhbat" : chat.type === "group" ? "Guruh" : "Kanal"} />
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="icon-btn pressable flex min-w-[84px] flex-col items-center gap-1.5 rounded-[16px] px-3 py-2.5">
      <span className="text-accent">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] bg-surface/60 px-3.5 py-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 break-words text-[13px] font-medium text-ink">{value}</p>
      </div>
    </div>
  )
}
