import { AtSign, Check, Pencil, X } from "lucide-react"
import { useState } from "react"
import * as authApi from "../../api/authApi"
import { isDemo } from "../../config/demo"
import type { KeyraUser } from "../../models/user"
import { useAuthStore } from "../../store/authStore"

const FIELD = "liquid-control w-full rounded-[15px] px-3.5 py-3 text-[13px] text-ink outline-none"

// Usernames: 3–32 chars, lowercase letters/digits/underscore, must start with a letter.
function cleanUsername(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 32)
}
function usernameError(value: string): string {
  if (value.length < 3) return "Kamida 3 ta belgi"
  if (!/^[a-z]/.test(value)) return "Harf bilan boshlaning"
  return ""
}

export function ProfileEditDialog({ user, onClose }: { user: KeyraUser; onClose: () => void }) {
  const [name, setName] = useState(user.displayName)
  const [username, setUsername] = useState(user.username)
  const [locale, setLocale] = useState(user.locale)
  const [country, setCountry] = useState(user.country)
  const [keyboard, setKeyboard] = useState(user.keyboard)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const usernameChanged = username !== user.username
  const nameError = !name.trim()
  const userError = usernameChanged ? usernameError(username) : ""
  const canSave = !busy && !nameError && !userError

  const save = async () => {
    if (!canSave) return
    setBusy(true)
    setError("")
    try {
      const patch = {
        displayName: name.trim(),
        ...(usernameChanged ? { username } : {}),
        locale,
        country,
        keyboard,
      }
      const next = isDemo()
        ? { ...user, displayName: name.trim(), username, locale, country, keyboard }
        : await authApi.updateProfile(patch)
      useAuthStore.getState().updateLocalProfile(next)
      setSaved(true)
      setTimeout(onClose, 550)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Saqlab bo'lmadi. Qayta urinib ko'ring.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-end justify-center bg-black/40 backdrop-blur-xl sm:items-center sm:p-4" onClick={onClose}>
      <div className="liquid-card w-full max-w-md rounded-b-none p-4 sm:rounded-[24px] sm:p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-[9px] font-bold uppercase tracking-[.14em] text-accent">Profil</p><h2 className="text-xl font-bold text-ink">Profilni tahrirlash</h2></div>
          <button onClick={onClose} aria-label="Yopish" className="icon-btn pressable absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] font-semibold text-muted">Ko'rinadigan ism
            <input className={`${FIELD} mt-1.5`} value={name} onChange={(event) => setName(event.target.value)} maxLength={48} placeholder="Ismingiz" />
          </label>

          <label className="block text-[10px] font-semibold text-muted">Username
            <div className={`liquid-control mt-1.5 flex items-center rounded-[15px] px-3.5 ${userError ? "ring-1 ring-danger/60" : ""}`}>
              <AtSign className="h-4 w-4 shrink-0 text-muted" />
              <input className="min-w-0 flex-1 bg-transparent px-1.5 py-3 text-[13px] text-ink outline-none" value={username} onChange={(event) => setUsername(cleanUsername(event.target.value))} maxLength={32} placeholder="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </div>
            {userError
              ? <span className="mt-1 block text-[10px] font-semibold text-danger">{userError}</span>
              : <span className="mt-1 block text-[10px] text-muted">a–z, 0–9 va _ belgilaridan foydalaning</span>}
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-semibold text-muted">Til
              <select className={`${FIELD} mt-1.5`} value={locale} onChange={(event) => setLocale(event.target.value)}>
                <option value="uz">O'zbekcha</option><option value="en">English</option><option value="ru">Русский</option>
              </select>
            </label>
            <label className="text-[10px] font-semibold text-muted">Davlat
              <input className={`${FIELD} mt-1.5 uppercase`} value={country} onChange={(event) => setCountry(event.target.value.slice(0, 2).toUpperCase())} placeholder="UZ" />
            </label>
          </div>

          <label className="block text-[10px] font-semibold text-muted">Klaviatura
            <select className={`${FIELD} mt-1.5`} value={keyboard} onChange={(event) => setKeyboard(event.target.value)}>
              <option value="qwerty">QWERTY</option><option value="azerty">AZERTY</option><option value="dvorak">Dvorak</option>
            </select>
          </label>

          {error && <p className="rounded-[14px] bg-danger/10 p-3 text-[11px] font-semibold text-danger">{error}</p>}

          <button onClick={() => void save()} disabled={!canSave} className="pressable flex w-full items-center justify-center gap-2 rounded-[15px] bg-accent py-3 text-[12px] font-bold text-white shadow-glow disabled:opacity-40">
            {saved ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {saved ? "Saqlandi" : busy ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
          </button>
        </div>
      </div>
    </div>
  )
}
