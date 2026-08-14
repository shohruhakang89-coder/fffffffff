import { Bell, ChevronRight, Loader2, Mic2, Play, Radio, Search, Sparkles, Star, Users, X } from "lucide-react"
import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { gameDescription, gameTitle, type GameManifest } from "../../models/marketplace"
import { useAuthStore } from "../../store/authStore"
import { useMarketplaceStore } from "../../store/marketplaceStore"
import { LiquidSearchBar } from "../../ui/LiquidSearchBar"
import { GameDetails } from "../marketplace/GameDetails"
import { GameIconBadge } from "../marketplace/GameIconBadge"
import { CategoryArt } from "../marketplace/PlayCategoryArt"

const CATEGORIES = [
  { id: "", label: "Siz uchun", art: "for-you" },
  { id: "subjects", label: "Fanlar", art: "apps" },
  { id: "skills", label: "Ko‘nikmalar", art: "games" },
  { id: "quiz", label: "Viktorina", art: "top-charts" },
  { id: "logic", label: "Mantiq", art: "kids" },
] as const
const PLAY_BUCKETS = ["12K", "34K", "88K", "142K", "310K", "1.2M"]
const gameStats = (slug: string) => { let h = 0; for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0; return { rating: (4.3 + (h % 7) / 10).toFixed(1), plays: PLAY_BUCKETS[h % PLAY_BUCKETS.length] } }
type Mode = "all" | "solo" | "live"

export function DashboardPage() {
  const locale = useAuthStore(s => s.user?.locale ?? "uz")
  const user = useAuthStore(s => s.user)
  const { games, status, error, load } = useMarketplaceStore()
  const [query, setQuery] = useState("")
  const [family, setFamily] = useState("")
  const [mode, setMode] = useState<Mode>("all")
  const [selected, setSelected] = useState<GameManifest | null>(null)
  const [hero, setHero] = useState(0)
  useEffect(() => { void load() }, [load])
  useEffect(() => { if (games.length < 2) return; const timer = window.setInterval(() => setHero(i => (i + 1) % Math.min(4, games.length)), 7000); return () => window.clearInterval(timer) }, [games.length])
  const filtered = useMemo(() => games.filter(game => {
    const q = query.trim().toLowerCase()
    const text = `${gameTitle(game, locale)} ${gameDescription(game, locale)} ${game.tags.join(" ")}`.toLowerCase()
    return (!q || text.includes(q)) && (!family || game.family === family) && (mode === "all" || mode === "solo" && game.supportsSolo || mode === "live" && game.supportsRealtime)
  }), [games, query, family, mode, locale])
  if (selected) return <div className="play-page play-detail"><GameDetails game={selected} onBack={() => setSelected(null)} /></div>
  const loading = (status === "idle" || status === "loading") && !games.length
  const featured = games[hero % Math.max(1, games.length)]
  const initial = (user?.displayName || user?.username || "A").charAt(0).toUpperCase()
  const reset = () => { setQuery(""); setFamily(""); setMode("all") }
  return <div className="play-page">
    <header className="pv-head"><div><div className="pv-title-row"><h1>Play</h1><span className="pv-online"><i />142 online</span></div><p>Ajoyib ilovalar va o‘yinlarni kashf eting</p></div><button className="pv-avatar" aria-label="Profil">{initial}</button></header>
    <div className="pv-search-row"><LiquidSearchBar query={query} onQuery={setQuery} placeholder="Ilova va o'yinlarni qidiring" icon={<Search className="h-4 w-4 text-muted" />} trailing={query ? <button type="button" onClick={() => setQuery("")} aria-label="Tozalash"><X className="h-4 w-4" /></button> : <Mic2 className="h-4 w-4 text-muted" />} size="sm" className="flex-1" /><button className="pv-bell" aria-label="Bildirishnomalar"><Bell /><span>3</span></button></div>
    <nav className="pv-cats" aria-label="Kategoriyalar">{CATEGORIES.map(category => <button key={category.id} className={family === category.id ? "active" : ""} onClick={() => setFamily(category.id)} aria-pressed={family === category.id}><CategoryArt id={category.art} /><b>{category.label}</b></button>)}</nav>
    <div className="pv-modes"><span>Rejim</span>{(["all","solo","live"] as Mode[]).map(value => <button key={value} className={mode === value ? "active" : ""} onClick={() => setMode(value)}>{value === "all" ? "Hammasi" : value === "solo" ? "Solo" : "Live"}</button>)}</div>
    {loading ? <HeroSkeleton /> : error && !games.length ? <Empty title="O‘yinlar yuklanmadi" body={error} action={() => void load(true)} actionLabel="Qayta urinish" /> : featured ? <HeroCard game={featured} locale={locale} index={hero % 4} count={Math.min(4, games.length)} onDot={setHero} onPlay={() => setSelected(featured)} /> : null}
    <section className="pv-section"><SectionTitle title="Siz uchun tavsiya" sub={`${filtered.length} ta tajriba`} />{loading ? <ListSkeleton /> : filtered.length === 0 ? <Empty title="Hech narsa topilmadi" body="Qidiruv yoki filtrlarni o‘zgartiring." action={reset} actionLabel="Filtrlarni tozalash" /> : <div className="pv-list">{filtered.map(game => <GameRow key={game.slug} game={game} locale={locale} onOpen={() => setSelected(game)} />)}</div>}</section>
  </div>
}

function HeroCard({ game, locale, index, count, onDot, onPlay }: { game: GameManifest; locale: string; index: number; count: number; onDot: (i:number) => void; onPlay: () => void }) {
  const s = gameStats(game.slug)
  return <section className="pv-hero" style={{ "--hue": game.accent } as CSSProperties}><div className="pv-hero-glow" /><div className="pv-hero-copy"><span><Sparkles /> EDITORS CHOICE</span><h2>{gameTitle(game, locale)}</h2><p>{gameDescription(game, locale)}</p><div className="pv-hero-meta"><b><Star />{s.rating}</b><b><Users />{s.plays} plays</b>{game.supportsRealtime && <b><Radio />Live</b>}</div><button className="pv-play" onClick={onPlay}><Play /> Play now</button></div><div className="pv-hero-object"><GameIconBadge slug={game.slug} accent={game.accent} size="xl" /><span /><span /><span /></div><div className="pv-dots">{Array.from({ length: count }).map((_,i) => <button key={i} className={i === index ? "active" : ""} onClick={() => onDot(i)} aria-label={`Slayd ${i + 1}`} />)}</div></section>
}
function GameRow({ game, locale, onOpen }: { game: GameManifest; locale: string; onOpen: () => void }) { const s = gameStats(game.slug); return <article className="pv-row"><button className="pv-row-main" onClick={onOpen} aria-label={gameTitle(game, locale)}><GameIconBadge slug={game.slug} accent={game.accent} size="md" /><div><h3>{gameTitle(game, locale)}</h3><p>{game.family.toUpperCase()} · {game.gameKind}</p><span><b>{s.rating} <Star /></b> · {game.supportsRealtime ? "Live Duel" : "Solo"}</span></div></button><button className="pv-row-play" onClick={onOpen}>Play</button></article> }
function SectionTitle({ title, sub }: { title: string; sub: string }) { return <div className="pv-section-title"><div><h2>{title}</h2><p>{sub}</p></div><button type="button">Barchasi <ChevronRight /></button></div> }
function Empty({ title, body, action, actionLabel }: { title: string; body: string; action: () => void; actionLabel: string }) { return <div className="pv-empty"><Search /><h3>{title}</h3><p>{body}</p><button onClick={action}>{actionLabel}</button></div> }
function HeroSkeleton() { return <div className="pv-hero pv-skeleton"><Loader2 /></div> }
function ListSkeleton() { return <div className="pv-list">{[1,2,3,4].map(i => <div className="pv-row pv-row-skeleton" key={i}><i /><div><b /><span /></div></div>)}</div> }
