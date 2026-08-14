import { ArrowLeft, ChevronRight, Globe2, Keyboard, LogOut, MonitorSmartphone, Pencil, ShieldCheck } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Routes } from "../../app/routes"
import { exitDemo, isDemo } from "../../config/demo"
import { useAccountsStore } from "../../store/accountsStore"
import { useAuthStore } from "../../store/authStore"
import { ConnectionBadge } from "../../ui/ConnectionBadge"
import { KeyraBackground } from "../../ui/KeyraBackground"
import { KeyraButton } from "../../ui/KeyraButton"
import { ThemeToggle } from "../../ui/ThemeToggle"
import { AccountSwitcher } from "./AccountSwitcher"
import { ProfileHeader } from "./ProfileHeader"
import { ProfileEditDialog } from "./ProfileEditDialog"

export function ProfilePage({ embedded = false }: { embedded?: boolean }) {
  const user = useAuthStore((store) => store.user)
  const busy = useAuthStore((store) => store.busy)
  const logout = useAuthStore((store) => store.logout)
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const demo = isDemo()
  if (!user) return null
  const leave = () => {
    if (demo) return exitDemo()
    useAccountsStore.getState().forgetActive()
    void logout()
  }
  const body = (
    <div className="mx-auto max-w-[1360px] px-3.5 pb-5 pt-4 sm:px-6 sm:pt-6 lg:px-2 xl:px-5">
      <header className="mb-4 flex items-center gap-2.5 sm:mb-6">
        {!embedded && <button onClick={() => navigate(Routes.home, { replace: true })} className="glass-key grid h-9 w-9 place-items-center rounded-[12px] text-muted"><ArrowLeft className="h-4 w-4" /></button>}
        <div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-muted">Hisob</p><h1 className="text-[28px] font-bold tracking-ios text-ink sm:text-[40px]">Profil</h1></div>
      </header>
      <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,.9fr)_minmax(410px,1.1fr)]">
        <div className="space-y-3.5"><div className="relative"><ProfileHeader user={user} /><button onClick={() => setEditing(true)} className="icon-btn pressable absolute right-4 top-4 z-10 flex h-9 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold"><Pencil className="h-3.5 w-3.5" /> Tahrirlash</button></div><AccountSwitcher /></div>
        <div className="space-y-3.5">
          <section className="liquid-card p-4 sm:p-5">
            <div className="mb-2.5 flex items-center justify-between gap-2"><div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-muted">Sozlamalar</p><h2 className="text-[16px] font-bold tracking-ios text-ink">Shaxsiy sozlash</h2></div><div className="flex items-center gap-2"><div className="w-[74px]"><ThemeToggle compact /></div><ConnectionBadge /></div></div>
            <InfoRow icon={<Globe2 />} label="Til" value={user.locale.toUpperCase()} />
            <InfoRow icon={<Keyboard />} label="Klaviatura" value={user.keyboard.toUpperCase()} />
            <InfoRow icon={<MonitorSmartphone />} label="Qurilma va seanslar" onClick={() => navigate(Routes.devices)} />
            <InfoRow icon={<ShieldCheck />} label="Ulanish xavfsizligi" value="Shifrlangan" />
          </section>
          <section className="liquid-card p-4 sm:p-5">
            <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-muted">Seans</p>
            <h2 className="mt-0.5 text-[16px] font-bold tracking-ios text-ink">{demo ? "Oflayn namoyish" : "Hisob boshqaruvi"}</h2>
            <p className="mb-4 mt-1 text-[11px] leading-relaxed text-muted">{demo ? "Faqat mahalliy kontent. Backend yoki shaxsiy hisob ulanmagan." : "Ushbu hisob uchun himoyalangan seansni boshqaring."}</p>
            <KeyraButton label={demo ? "Namoyishdan chiqish" : "Chiqish"} kind="danger" loading={busy} onClick={leave} icon={<LogOut className="h-4 w-4" />} />
          </section>
        </div>
      </div>
      {editing && <ProfileEditDialog user={user} onClose={() => setEditing(false)} />}
    </div>
  )
  return embedded ? body : <KeyraBackground>{body}</KeyraBackground>
}

function InfoRow({ icon, label, value, onClick }: { icon: ReactNode; label: string; value?: string; onClick?: () => void }) {
  const content = <><span className="grid h-9 w-9 place-items-center rounded-[12px] bg-surface/70 text-muted [&>svg]:h-4 [&>svg]:w-4">{icon}</span><span className="min-w-0 flex-1 text-[12px] font-semibold text-ink">{label}</span>{value && <span className="text-[10px] text-muted">{value}</span>}{onClick && <ChevronRight className="h-3.5 w-3.5 text-muted" />}</>
  return onClick ? <button onClick={onClick} className="pressable mt-1.5 flex w-full items-center gap-2.5 rounded-[15px] bg-surfaceHi/70 p-2 text-left">{content}</button> : <div className="mt-1.5 flex items-center gap-2.5 rounded-[15px] bg-surfaceHi/70 p-2">{content}</div>
}
