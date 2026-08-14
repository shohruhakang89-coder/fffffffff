import { Clock3, Gamepad2, MessageCircle, Target, UserRound } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useAuthStore } from "../../store/authStore"
import { useUiStore } from "../../store/uiStore"
import { KeyraBackground } from "../../ui/KeyraBackground"
import { ThemeToggle } from "../../ui/ThemeToggle"
import { ChatPage } from "../chat/ChatPage"
import { MarketplacePage } from "../marketplace/MarketplacePage"
import { ProfilePage } from "../profile/ProfilePage"
import { HistoryPage } from "./HistoryPage"

type TabId = "play" | "chat" | "history" | "profile"
interface Tab { id: TabId; label: string; icon: ReactNode }
const TABS: Tab[] = [
  { id: "play", label: "O‘ynash", icon: <Gamepad2 className="h-[19px] w-[19px]" /> },
  { id: "chat", label: "Suhbat", icon: <MessageCircle className="h-[19px] w-[19px]" /> },
  { id: "history", label: "Tarix", icon: <Clock3 className="h-[19px] w-[19px]" /> },
  { id: "profile", label: "Profil", icon: <UserRound className="h-[19px] w-[19px]" /> },
]

function contentFor(tab: TabId): ReactNode {
  if (tab === "chat") return <ChatPage />
  if (tab === "history") return <HistoryPage />
  if (tab === "profile") return <ProfilePage embedded />
  return <MarketplacePage />
}

export function HomeShell() {
  const [active, setActive] = useState<TabId>("play")
  const user = useAuthStore((store) => store.user)
  const navHidden = useUiStore((store) => store.mobileNavHidden)
  const initial = (user?.displayName || user?.username || "K").charAt(0).toUpperCase()
  return (
    <KeyraBackground>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1580px] gap-4 lg:px-4 xl:gap-5">
        <aside className="hidden w-[88px] shrink-0 py-4 lg:block xl:w-[220px]">
          <div className="desktop-dock liquid-dock top-4 h-[calc(100dvh-32px)] overflow-hidden rounded-[28px] p-3">
            <span className="pointer-events-none absolute -left-20 top-[42%] h-56 w-56 rounded-full bg-accentSoft/70 blur-3xl" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-12 items-center justify-center gap-2.5 xl:justify-start xl:px-1.5">
                <img src="/assets/keyra-glass-mark.svg" alt="" className="theme-art h-10 w-10" />
                <span className="hidden text-lg font-bold tracking-ios text-ink xl:block">Keyra</span>
              </div>
              <div className="my-3 h-px bg-line/60" />
              <nav className="flex flex-col gap-1.5">{TABS.map((tab) => <DockButton key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />)}</nav>
              <div className="mt-auto hidden rounded-[18px] bg-surface/60 p-3 shadow-sm xl:block">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-muted"><Target className="h-3.5 w-3.5 text-accent" /> Daily focus</div>
                <div className="mt-2 flex items-end justify-between"><span className="text-lg font-bold text-ink">72%</span><span className="text-[9px] text-muted">18 / 25 min</span></div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/70"><div className="h-full w-[72%] rounded-full bg-accent" /></div>
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-2.5 rounded-[18px] bg-surface/75 p-2 shadow-sm xl:justify-start">
                <span className="glass-key grid h-9 w-9 shrink-0 place-items-center rounded-[12px] text-sm font-bold text-accent">{initial}</span>
                <span className="hidden min-w-0 xl:block"><span className="block truncate text-[13px] font-semibold text-ink">{user?.displayName}</span><span className="block truncate text-[9px] text-muted">@{user?.username} - {user?.tier}</span></span>
              </div>
              <div className="mt-2.5"><ThemeToggle compact /></div>
            </div>
          </div>
        </aside>
        <main className={`min-w-0 flex-1 ${navHidden ? "pb-0" : "pb-[calc(78px+env(safe-area-inset-bottom))]"} lg:pb-4`}><div key={active} className="page-enter min-h-full">{contentFor(active)}</div></main>
      </div>
      <nav className={`mobile-footer liquid-dock bottom-[calc(8px+env(safe-area-inset-bottom))] left-1/2 flex w-[calc(100%-16px)] max-w-md -translate-x-1/2 items-center rounded-[24px] p-1 lg:hidden ${navHidden ? "hidden" : ""}`}>
        {TABS.map((tab) => <MobileButton key={tab.id} tab={tab} active={active === tab.id} onClick={() => setActive(tab.id)} />)}
      </nav>
    </KeyraBackground>
  )
}

function DockButton({ tab, active, onClick }: { tab: Tab; active: boolean; onClick: () => void }) {
  const activeStyle = "lg-glass bg-accent/12 text-accent"
  const inactiveStyle = "text-muted hover:bg-surface/[0.65] hover:text-ink border border-transparent"
  return (
    <button onClick={onClick} title={tab.label} className={`pressable flex w-full items-center justify-center gap-2.5 rounded-[15px] py-2.5 text-[13px] font-semibold xl:justify-start xl:px-3 ${active ? activeStyle : inactiveStyle}`}>
      {tab.icon}
      <span className="hidden xl:block">{tab.label}</span>
    </button>
  )
}

function MobileButton({ tab, active, onClick }: { tab: Tab; active: boolean; onClick: () => void }) {
  const activeStyle = "lg-glass bg-accent/12 text-accent"
  const inactiveStyle = "text-muted border border-transparent"
  return (
    <button onClick={onClick} className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-[18px] py-1.5 text-[9px] font-semibold transition ${active ? activeStyle : inactiveStyle}`}>
      {tab.icon}
      <span>{tab.label}</span>
      {active && <i className="absolute bottom-1 h-0.5 w-3 rounded-full bg-accent" />}
    </button>
  )
}
