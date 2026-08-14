import { Copy, CornerUpLeft, MoreHorizontal, Pencil, Plus, Reply, Send, Trash2, X } from "lucide-react"
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { chatApi } from "../../api/chatApi"
import type { Json } from "../../lib/net/rpcEnvelope"
import type { Chat, ChatMessage } from "../../models/chat"
import { useAuthStore } from "../../store/authStore"
import { rpc } from "../../store/client"
import { useUiStore } from "../../store/uiStore"
import { ChatThreadHeader } from "./ChatThreadHeader"

const mapOf = (v: unknown): Json | null => (typeof v === "object" && v !== null ? (v as Json) : null)
const safeDate = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? new Date() : d }
const dayKey = (iso: string) => safeDate(iso).toDateString()
const dayLabel = (iso: string) => {
  const d = safeDate(iso)
  if (d.toDateString() === new Date().toDateString()) return "Bugun"
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
}

function MenuItem({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button role="menuitem" type="button" onClick={onClick}
      className={`pressable flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[12px] font-semibold ${danger ? "text-red-500 hover:bg-red-500/10" : "text-ink hover:bg-white/10"}`}>
      {icon}{label}
    </button>
  )
}

export function ChatThread({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const me = useAuthStore((s) => s.user)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [editingId, setEditingId] = useState(0)
  const [editedIds, setEditedIds] = useState<Set<number>>(() => new Set())
  const [menuId, setMenuId] = useState(0)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [deleteId, setDeleteId] = useState(0)
  const [feedback, setFeedback] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollBottom = () => setTimeout(() => { const n = scrollRef.current; if (n) n.scrollTop = n.scrollHeight }, 40)
  const closeMenu = () => { setMenuId(0); setDeleteId(0) }
  const openMenu = (id: number, x: number, y: number) => {
    const gutter = 8, w = 188, h = 232
    setMenuPos({ x: Math.max(gutter, Math.min(x, window.innerWidth - w - gutter)), y: Math.max(gutter, Math.min(y, window.innerHeight - h - gutter)) })
    setMenuId(id); setDeleteId(0)
  }
  const notify = (v: string) => { setFeedback(v); window.setTimeout(() => setFeedback((c) => (c === v ? "" : c)), 1800) }
  const cancelEdit = () => { setEditingId(0); setText("") }
  const chooseReply = (m: ChatMessage) => { setReplyTo(m); setEditingId(0); closeMenu(); setTimeout(() => document.getElementById("chat-composer")?.focus(), 0) }
  const beginEdit = (m: ChatMessage) => {
    setEditingId(m.id); setReplyTo(null); setText(m.message_text ?? ""); closeMenu()
    setTimeout(() => { const el = document.getElementById("chat-composer") as HTMLInputElement | null; if (el) { el.focus(); const v = el.value; el.value = ""; el.value = v } }, 0)
  }
  const copyMessage = async (m: ChatMessage) => {
    const value = m.message_text ?? ""
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value)
      else { const a = document.createElement("textarea"); a.value = value; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); if (!document.execCommand("copy")) throw new Error("copy failed"); a.remove() }
      notify("Nusxalandi")
    } catch { notify("Nusxalab bo'lmadi") }
    closeMenu()
  }
  const removeLocal = (id: number) => { setMessages((cur) => cur.filter((it) => it.id !== id)); if (replyTo?.id === id) setReplyTo(null); if (editingId === id) cancelEdit(); closeMenu(); notify("Xabar o'chirildi") }
  const startPress = (id: number, x: number, y: number) => { if (pressTimer.current) clearTimeout(pressTimer.current); pressTimer.current = setTimeout(() => { pressTimer.current = null; openMenu(id, x, y) }, 520) }
  const stopPress = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null } }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    if (editingId > 0) {
      setMessages((cur) => cur.map((m) => (m.id === editingId ? { ...m, message_text: value } : m)))
      setEditedIds((cur) => { const next = new Set(cur); next.add(editingId); return next })
      setEditingId(0); setText(""); notify("Xabar tahrirlandi"); return
    }
    const pending = replyTo
    try {
      const id = await chatApi.send(chat.id, "text", value, { reply_to_id: pending?.id ?? 0 })
      setText(""); setReplyTo(null)
      if (id > 0) setMessages((cur) => (cur.some((x) => x.id === id) ? cur : [...cur, { id, chat_id: chat.id, sender_id: me?.id ?? 1, message_type: "text", message_text: value, payload: {}, file_id: "", reply_to_id: pending?.id ?? 0, is_deleted: false, created_at: new Date().toISOString() }]))
      scrollBottom()
    } catch { notify("Xabar yuborilmadi") }
  }
  useEffect(() => {
    let active = true; setLoading(true); setMessages([]); closeMenu(); setReplyTo(null); setEditingId(0)
    chatApi.history(chat.id, 0, 50).then(async (items) => { if (!active) return; const newest = items[0]; setMessages([...items].reverse()); if (newest) await chatApi.read(chat.id, newest.id) }).catch(() => { if (active) notify("Xabarlarni yuklab bo'lmadi") }).finally(() => { if (active) setLoading(false); scrollBottom() })
    return () => { active = false }
  }, [chat.id])
  useEffect(() => rpc.onEvent((event) => {
    if (event["event"] !== "chat.message") return
    const data = mapOf(event["payload"]); if (!data || Number(data["chat_id"]) !== chat.id) return
    const id = Number(data["message_id"] ?? 0); if (id <= 0) return
    const incoming: ChatMessage = { id, chat_id: chat.id, sender_id: Number(data["sender_id"] ?? 0), message_type: "text", message_text: String(data["text"] ?? ""), payload: {}, file_id: "", reply_to_id: Number(data["reply_to_id"] ?? 0), is_deleted: false, created_at: new Date().toISOString() }
    setMessages((cur) => (cur.some((x) => x.id === id) ? cur : [...cur, incoming])); void chatApi.read(chat.id, id); scrollBottom()
  }), [chat.id])
  useEffect(() => {
    const close = (e: PointerEvent) => { const t = e.target as HTMLElement | null; if (!t?.closest("[data-message-actions]")) closeMenu() }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { closeMenu(); setReplyTo(null); setEditingId((id) => (id ? (setText(""), 0) : 0)) } }
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc) }
  }, [])
  useEffect(() => () => { if (pressTimer.current) clearTimeout(pressTimer.current) }, [])
  // Hide the HomeShell mobile bottom nav while a thread is open so it gets the full viewport.
  useEffect(() => { const set = useUiStore.getState().setMobileNavHidden; set(true); return () => set(false) }, [])
  const active = messages.find((m) => m.id === menuId) ?? null
  const activeMine = !!active && active.sender_id === me?.id

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <ChatThreadHeader chat={chat} onBack={onBack} />
      {feedback && (
        <div role="status" aria-live="polite" className="glass pointer-events-none absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[12px] font-semibold text-ink shadow-xl">{feedback}</div>
      )}
      <div ref={scrollRef} className="scroll-clean relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-5 sm:px-7">
        {loading && !messages.length ? (
          <div className="m-auto text-[12px] text-muted">Yuklanmoqda...</div>
        ) : !messages.length ? (
          <div className="chat-bubble m-auto rounded-[18px] px-6 py-5 text-center text-[12px] text-muted">Hozircha xabar yo'q.</div>
        ) : (
          messages.map((message, i) => {
            const mine = message.sender_id === me?.id
            const showDay = i === 0 || dayKey(messages[i - 1].created_at) !== dayKey(message.created_at)
            const edited = editedIds.has(message.id)
            return (
              <Fragment key={message.id}>
                {showDay && <div className="date-pill mx-auto my-2 rounded-full px-3.5 py-1.5 text-[10px] font-bold text-muted">{dayLabel(message.created_at)}</div>}
                <div
                  className={`message-in group relative flex max-w-[86%] flex-col sm:max-w-[82%] ${mine ? "self-end items-end" : "self-start items-start"}`}
                  onContextMenu={(e) => { e.preventDefault(); stopPress(); openMenu(message.id, e.clientX, e.clientY) }}
                  onPointerDown={(e) => { if (e.pointerType !== "mouse") startPress(message.id, e.clientX, e.clientY) }}
                  onPointerUp={stopPress} onPointerCancel={stopPress} onPointerMove={stopPress}
                >
                  {message.reply_to_id > 0 && <span className="mb-1 inline-flex items-center gap-1 px-2 text-[9px] text-muted"><CornerUpLeft className="h-3 w-3" /> Javob</span>}
                  <div className={`flex items-center gap-1.5 ${mine ? "flex-row" : "flex-row-reverse"}`}>
                    <button
                      type="button" aria-label="Amallar"
                      data-message-actions
                      onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); openMenu(message.id, mine ? r.left - 188 : r.right, r.top) }}
                      className="pressable grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted opacity-0 transition-opacity hover:bg-white/10 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <div className={`chat-bubble select-text px-4 py-2.5 text-[14px] leading-relaxed text-ink ${mine ? "rounded-[21px] rounded-br-[7px] bg-accent/[0.14]" : "rounded-[21px] rounded-bl-[7px] bg-surface/70"}`}>{message.message_text}</div>
                  </div>
                  <span className="mt-1 px-1.5 text-[10px] text-muted">
                    {safeDate(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {edited && <span className="ml-1 italic">tahrirlandi</span>}
                  </span>
                </div>
              </Fragment>
            )
          })
        )}
      </div>

      {active && createPortal(
        <div data-message-actions role="menu" style={{ left: menuPos.x, top: menuPos.y }} className="glass fixed z-[60] min-w-[188px] rounded-[20px] border border-white/20 p-1.5 shadow-2xl backdrop-blur-2xl">
          {deleteId === active.id ? (
            <div className="p-2">
              <p className="mb-2 text-[12px] font-semibold text-ink">Xabar o'chirilsinmi?</p>
              <p className="mb-3 text-[10px] text-muted">Bu faqat sizning ekraningizdan olib tashlanadi.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDeleteId(0)} className="pressable flex-1 rounded-full bg-surface/70 px-3 py-2 text-[11px] font-semibold text-ink">Bekor</button>
                <button type="button" onClick={() => removeLocal(active.id)} className="pressable flex-1 rounded-full bg-red-500 px-3 py-2 text-[11px] font-semibold text-white">O'chirish</button>
              </div>
            </div>
          ) : (
            <>
              <MenuItem icon={<Reply className="h-4 w-4 text-accent" />} label="Javob berish" onClick={() => chooseReply(active)} />
              {activeMine && <MenuItem icon={<Pencil className="h-4 w-4 text-accent" />} label="Tahrirlash" onClick={() => beginEdit(active)} />}
              <MenuItem icon={<Copy className="h-4 w-4 text-accent" />} label="Nusxalash" onClick={() => void copyMessage(active)} />
              <MenuItem icon={<Trash2 className="h-4 w-4" />} label="O'chirish" danger onClick={() => setDeleteId(active.id)} />
            </>
          )}
        </div>,
        document.body,
      )}

      <div className="shrink-0 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2 sm:px-4">
        {editingId > 0 && (
          <div className="glass mx-2 mb-2 flex items-center gap-3 rounded-[18px] px-4 py-2.5">
            <Pencil className="h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-accent">Tahrirlanmoqda</p><p className="truncate text-[12px] text-muted">{messages.find((m) => m.id === editingId)?.message_text || "Xabar"}</p></div>
            <button type="button" onClick={cancelEdit} aria-label="Bekor qilish" className="pressable grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
        )}
        {replyTo && (
          <div className="glass mx-2 mb-2 flex items-center gap-3 rounded-[18px] px-4 py-2.5">
            <Reply className="h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-accent">Javob berilmoqda</p><p className="truncate text-[12px] text-muted">{replyTo.message_text || "Xabar"}</p></div>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Bekor qilish" className="pressable grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
        )}
        <form onSubmit={submit} className="glass flex items-center gap-2 rounded-[26px] p-2">
          <button type="button" className="glass-key pressable grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted"><Plus className="h-5 w-5" /></button>
          <input id="chat-composer" value={text} onChange={(e) => setText(e.target.value)} placeholder={editingId ? "Xabarni tahrirlang…" : replyTo ? "Javob yozing…" : "Xabar"} className="min-w-0 flex-1 bg-transparent px-1 text-[14px] text-ink outline-none placeholder:text-muted" />
          <button type="submit" disabled={!text.trim()} className="pressable grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white shadow-glow transition-opacity [box-shadow:inset_1px_1px_0_0_rgba(255,255,255,.5),inset_0_-3px_8px_-3px_rgba(0,0,0,.25),0_8px_20px_-8px_rgb(var(--keyra-accent-rgb))] disabled:opacity-30"><Send className="h-[18px] w-[18px]" /></button>
        </form>
      </div>
    </div>
  )
}
