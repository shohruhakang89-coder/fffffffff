import {
  Bell,
  ChevronRight,
  Flame,
  Heart,
  Info,
  Mic,
  MoreVertical,
  Play,
  Radio,
  Search,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import {
  gameDescription,
  gameTitle,
  type GameManifest,
} from "../../models/marketplace"
import { useAuthStore } from "../../store/authStore"
import { useMarketplaceStore } from "../../store/marketplaceStore"
import { ThemeToggle } from "../../ui/ThemeToggle"
import { LiquidSearchBar } from "../../ui/LiquidSearchBar"
import { CategoryArt } from "./PlayCategoryArt"
import { GameDetails } from "./GameDetails"
import { GameIconBadge } from "./GameIconBadge"
import { coverUrl, gameVisual, hasCover, type GameVisual } from "./gameVisuals"

// Stable per-game rating + play count derived from the slug, so every card
// shows something distinct instead of a repeated "4.6 ★ / 100K".
const PLAY_BUCKETS = ["12K", "34K", "88K", "142K", "310K", "1.2M"]
function gameStats(slug: string) {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return {
    rating: (4.3 + (h % 7) / 10).toFixed(1), // 4.3 – 4.9
    plays: PLAY_BUCKETS[h % PLAY_BUCKETS.length],
  }
}

const CATEGORY_TILES = [
  { id: "for-you", label: "Siz uchun" },
  { id: "games", label: "O‘yinlar" },
  { id: "apps", label: "Ilovalar" },
  { id: "top-charts", label: "Reyting" },
  { id: "kids", label: "Bolalar" },
] as const

const TOP_CHART_TABS = [
  { id: "top-free", label: "Ommabop", icon: Star },
  { id: "top-grossing", label: "Eng yaxshi", icon: Trophy },
  { id: "trending", label: "Trendda", icon: Flame },
] as const

const RANK_STYLES = [
  "bg-amber/15 text-amber",
  "bg-slate-400/15 text-slate-400 dark:text-slate-300",
  "bg-orange-500/15 text-orange-500",
]

export function MarketplacePage() {
  const user = useAuthStore((s) => s.user)
  const locale = user?.locale ?? "en"
  const { games, status, load } = useMarketplaceStore()
  const [selected, setSelected] = useState<GameManifest | null>(null)
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("for-you")
  const [topChartTab, setTopChartTab] = useState("top-free")
  const [heroIndex, setHeroIndex] = useState(0)
  const [activeMenuSlug, setActiveMenuSlug] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

  useEffect(() => {
    void load()
  }, [load])

  const heroCount = Math.min(4, games.length || 1)

  // Auto-advance the hero banner carousel.
  useEffect(() => {
    if (games.length < 2) return
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroCount)
    }, 6000)
    return () => clearInterval(timer)
  }, [games.length, heroCount])

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase()
    return games.filter((g) => {
      const title = gameTitle(g, locale).toLowerCase()
      const desc = gameDescription(g, locale).toLowerCase()
      const matchesSearch =
        !q || title.includes(q) || desc.includes(q) || g.tags.some((t) => t.includes(q))
      if (!matchesSearch) return false
      if (activeCategory === "games") return g.family === "subjects" || g.family === "skills"
      if (activeCategory === "apps") return g.family === "logic" || g.family === "quiz"
      if (activeCategory === "top-charts") return g.status === "live"
      if (activeCategory === "kids") return g.supportsSolo
      return true
    })
  }, [games, query, activeCategory, locale])

  const featuredGame = games[heroIndex % (games.length || 1)] ?? games[0]

  const toggleFavorite = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => ({ ...prev, [slug]: !prev[slug] }))
    setActiveMenuSlug(null)
  }

  // The ⋯ menu is rendered through a portal to document.body so it escapes the
  // `.play-section-card` stacking context (isolation:isolate + backdrop-filter),
  // which otherwise lets the next section paint over the dropdown and eat clicks.
  // We anchor it to the button's viewport rect and clamp it on-screen.
  const openGameMenu = (slug: string, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const W = 192
    const H = 160
    const x = Math.min(Math.max(8, rect.right - W), window.innerWidth - W - 8)
    const y = Math.min(rect.bottom + 6, window.innerHeight - H - 8)
    setMenuPos({ x, y })
    setActiveMenuSlug(slug)
  }

  const menuGame = activeMenuSlug ? games.find((g) => g.slug === activeMenuSlug) ?? null : null

  if (selected) {
    return (
      <div className="mx-auto max-w-[1360px] px-3 pb-24 pt-4 sm:px-6">
        <GameDetails game={selected} onBack={() => setSelected(null)} />
      </div>
    )
  }

  const loading = status === "loading" && games.length === 0

  return (
    <div className="min-h-screen px-3 pb-6 pt-2 sm:px-6 sm:pb-24 sm:pt-3 lg:px-8">
      <div className="mx-auto max-w-[1240px] space-y-4 sm:space-y-6">
        {/* ── 1. HEADER ── */}
        <header className="flex items-start justify-between pt-1 sm:pt-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-extrabold tracking-ios text-ink sm:text-[34px]">
                Play
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/15 px-2 py-0.5 text-[9px] font-extrabold text-mint sm:px-2.5 sm:text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" />
                142 onlayn
              </span>
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-muted sm:text-[13px]">
              Zo‘r o‘yin va ilovalarni kashf eting
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden w-[132px] sm:block">
              <ThemeToggle compact />
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-accent/30 to-accent/60 p-0.5 shadow-glow sm:h-11 sm:w-11">
              <div className="grid h-full w-full place-items-center rounded-full bg-surface text-[12px] font-bold text-ink sm:text-[13px]">
                {(user?.displayName || user?.username || "K").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* ── 2. SEARCH + BELL ── */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <LiquidSearchBar
            query={query}
            onQuery={setQuery}
            placeholder="O'yin va ilovalarni qidiring"
            icon={<Search className="h-4 w-4 text-muted" />}
            trailing={
              query ? (
                <button onClick={() => setQuery("")} className="text-[11px] font-bold text-muted hover:text-ink">Tozalash</button>
              ) : (
                <Mic className="h-4 w-4 cursor-pointer text-muted hover:text-ink" />
              )
            }
            className="flex-1"
            size="sm"
          />

          <button className="glass-key pressable relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink sm:h-[50px] sm:w-[50px]">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-accent text-[9px] font-extrabold text-white ring-2 ring-bg">
              3
            </span>
          </button>
        </div>

        {/* ── 3. CATEGORY TILES ── */}
        <div className="scroll-clean -mx-3 flex gap-2.5 overflow-x-auto px-3 pb-1 sm:-mx-6 sm:gap-3 sm:px-6">
          {CATEGORY_TILES.map((tile) => {
            const isActive = activeCategory === tile.id
            return (
              <button
                key={tile.id}
                onClick={() => setActiveCategory(tile.id)}
                className={`play-tile-card pressable relative flex w-[104px] shrink-0 flex-col rounded-[20px] p-2 pb-2.5 sm:w-[124px] ${
                  isActive ? "ring-1 ring-accent/40" : ""
                }`}
              >
                <CategoryArt id={tile.id} />
                <div className="mt-1 flex items-center justify-between pl-1.5 pr-1">
                  <span
                    className={`relative text-[12px] font-bold tracking-tight sm:text-[13px] ${
                      isActive ? "text-accent" : "text-ink"
                    }`}
                  >
                    {tile.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-accent" />
                    )}
                  </span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-accent" : "text-muted"}`}
                  />
                </div>
              </button>
            )
          })}
        </div>

        {/* ── 4. HERO CAROUSEL ── */}
        {loading ? (
          <div className="h-[164px] w-full animate-pulse rounded-[22px] bg-surfaceHi/70 sm:h-[248px] sm:rounded-[28px]" />
        ) : (
          featuredGame && (
            <HeroBanner
              key={featuredGame.slug}
              game={featuredGame}
              locale={locale}
              index={heroIndex % heroCount}
              count={heroCount}
              onSelect={() => setSelected(featuredGame)}
              onDot={setHeroIndex}
            />
          )
        )}

        {/* ── 5. RECOMMENDED FOR YOU ── */}
        <section className="play-section-card p-3.5 sm:p-6">
          <SectionHeading title="Siz uchun tavsiya" />
          {loading ? (
            <SkeletonList />
          ) : filteredGames.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <div className="divide-y divide-line/50">
              {filteredGames.slice(0, 5).map((game) => {
                const isFav = !!favorites[game.slug]
                const isMenuOpen = activeMenuSlug === game.slug
                const stats = gameStats(game.slug)
                return (
                  <div
                    key={game.slug}
                    className="group relative flex items-center justify-between gap-2.5 py-2.5 first:pt-0 last:pb-0 sm:gap-3 sm:py-3.5"
                  >
                    <div
                      onClick={() => setSelected(game)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 sm:gap-3.5"
                    >
                      <GameIconBadge slug={game.slug} accent={game.accent} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-[14px] font-extrabold text-ink transition-colors group-hover:text-accent">
                            {gameTitle(game, locale)}
                          </h3>
                          {isFav && (
                            <Heart className="h-3.5 w-3.5 shrink-0 fill-danger text-danger" />
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-muted">
                          {game.family.toUpperCase()} • {game.gameKind}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-muted">
                          <span className="inline-flex items-center gap-0.5 text-amber">
                            {stats.rating} <Star className="h-2.5 w-2.5 fill-current" />
                          </span>
                          <span className="text-line">|</span>
                          <span className="inline-flex items-center gap-1">
                            {game.supportsRealtime ? (
                              <>
                                <Radio className="h-2.5 w-2.5 text-mint" /> Jonli duel
                              </>
                            ) : (
                              "Yakka"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelected(game)}
                        className="pressable inline-flex h-8 items-center rounded-full bg-accent/10 px-4 text-[12px] font-bold text-accent transition-colors hover:bg-accent hover:text-white"
                      >
                        O‘ynash
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isMenuOpen) {
                            setActiveMenuSlug(null)
                            return
                          }
                          openGameMenu(game.slug, e.currentTarget)
                        }}
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        aria-label="Ko‘proq"
                        className={`rounded-lg p-1.5 transition-colors hover:bg-surfaceHi hover:text-ink ${
                          isMenuOpen ? "bg-surfaceHi text-ink" : "text-muted"
                        }`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── 6. TOP CHARTS ── */}
        <section className="space-y-3 sm:space-y-3.5">
          <SectionHeading title="Reyting" />

          <div className="scroll-clean -mx-1 flex gap-2 overflow-x-auto px-1">
            {TOP_CHART_TABS.map((tab) => {
              const isActive = topChartTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setTopChartTab(tab.id)}
                  className={`pressable inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold transition-all ${
                    isActive
                      ? "bg-accent text-white shadow-glow"
                      : "border border-line/70 bg-surface text-muted hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(loading ? [] : filteredGames.slice(0, 6)).map((game, idx) => {
              const stats = gameStats(game.slug)
              const rankClass = RANK_STYLES[idx] ?? "bg-surfaceHi text-muted"
              return (
                <button
                  key={`top-${game.slug}`}
                  onClick={() => setSelected(game)}
                  className="play-tile-card pressable group flex items-center gap-3 rounded-[20px] p-3 text-left"
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-extrabold ${rankClass}`}
                  >
                    {idx + 1}
                  </span>
                  <GameIconBadge slug={game.slug} accent={game.accent} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[13px] font-bold text-ink">
                      {gameTitle(game, locale)}
                    </h4>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted">
                      <span className="inline-flex items-center gap-0.5 text-amber">
                        {stats.rating} <Star className="h-2.5 w-2.5 fill-current" />
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Users className="h-2.5 w-2.5" />
                        {game.minPlayers}-{game.maxPlayers}
                      </span>
                    </span>
                  </div>
                  <span className="pressable inline-flex h-7 items-center rounded-full bg-accent/10 px-3 text-[11px] font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                    O‘ynash
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Hero banner ────────────────────────────────────────────────────────────
function HeroBanner({
  game,
  locale,
  index,
  count,
  onSelect,
  onDot,
}: {
  game: GameManifest
  locale: string
  index: number
  count: number
  onSelect: () => void
  onDot: (i: number) => void
}) {
  const visual = gameVisual(game.slug, game.accent)
  const stats = gameStats(game.slug)
  return (
    <section className="play-section-card hero-slide relative overflow-hidden p-4 sm:p-6 lg:p-7">
      {/* tinted ambient glows behind the glass */}
      <div
        className="pointer-events-none absolute -right-8 -top-14 h-52 w-52 rounded-full opacity-60 blur-3xl"
        style={{ background: visual.heroOrb }}
      />
      <div className="pointer-events-none absolute -bottom-16 right-28 h-44 w-44 rounded-full bg-accentSoft/40 blur-3xl" />

      <div className="relative z-10 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/12 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-accent sm:text-[10px]">
            <Sparkles className="h-3 w-3" /> Tahririyat tanlovi
          </span>

          <h2 className="mt-2.5 text-[21px] font-extrabold leading-[1.05] tracking-ios text-ink sm:mt-3 sm:text-[30px]">
            {gameTitle(game, locale)}
          </h2>
          <p className="mt-1.5 line-clamp-2 max-w-[94%] text-[12px] leading-relaxed text-muted sm:text-[14px]">
            {gameDescription(game, locale)}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-bold sm:mt-3 sm:text-[12px]">
            <span className="inline-flex items-center gap-1 text-ink">
              {stats.rating} <Star className="h-3 w-3 fill-amber text-amber" />
            </span>
            <span className="h-3 w-px bg-line" />
            <span className="text-muted">{stats.plays} o‘yin</span>
            {game.supportsRealtime && (
              <>
                <span className="h-3 w-px bg-line" />
                <span className="inline-flex items-center gap-1 text-accent">
                  <Radio className="h-3 w-3" /> Jonli
                </span>
              </>
            )}
          </div>

          <button
            onClick={onSelect}
            className="pressable mt-3.5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[12px] font-extrabold text-white shadow-glow sm:mt-4 sm:px-6 sm:text-[13px]"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Hoziroq o‘ynash
          </button>

          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => onDot(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === i ? "w-5 bg-accent" : "w-1.5 bg-line hover:bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <HeroCoverArt slug={game.slug} visual={visual} title={gameTitle(game, locale)} />
      </div>
    </section>
  )
}

// The right-hand hero visual. Shows the real generated cover art for the game in
// a tilted glass frame; if the image is missing or fails to load it gracefully
// falls back to the frosted glass squircle + glyph.
function HeroCoverArt({
  slug,
  visual,
  title,
}: {
  slug: string
  visual: GameVisual
  title: string
}) {
  const [failed, setFailed] = useState(false)
  if (!hasCover(slug) || failed) return <HeroGlassArt visual={visual} />
  return (
    <div className="hero-float relative grid h-[118px] w-[104px] shrink-0 place-items-center sm:h-[178px] sm:w-[176px]">
      <span
        className="pointer-events-none absolute h-24 w-24 rounded-full blur-2xl sm:h-36 sm:w-36"
        style={{ background: visual.heroOrb }}
      />
      <div
        className="relative h-[106px] w-[94px] -rotate-[6deg] overflow-hidden rounded-[22px] border border-white/70 sm:h-[160px] sm:w-[142px] sm:rounded-[28px]"
        style={{
          boxShadow: `inset 0 2px 4px rgba(255,255,255,.6), 0 24px 40px -18px ${visual.tint}99`,
        }}
      >
        <img
          src={coverUrl(slug)}
          alt={title}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/40" />
        <span className="pointer-events-none absolute left-2 top-2 h-4 w-7 rounded-full bg-white/70 blur-[4px] sm:h-5 sm:w-9" />
      </div>
      <GlassBubble tint={visual.tint} className="left-0 top-3 h-5 w-5 sm:h-7 sm:w-7" />
      <GlassBubble tint={visual.tint} className="bottom-4 right-1 h-4 w-4 sm:bottom-6 sm:h-6 sm:w-6" />
    </div>
  )
}

// The frosted 3D-glass illustration on the right of the hero — a tilted glass
// squircle holding the game glyph, ringed by small floating glass bubbles.
// Echoes the reference's "liquid glass" app-store art, tinted per game.
function HeroGlassArt({ visual }: { visual: GameVisual }) {
  return (
    <div className="hero-float relative grid h-[118px] w-[104px] shrink-0 place-items-center sm:h-[178px] sm:w-[176px]">
      <span
        className="pointer-events-none absolute h-24 w-24 rounded-full blur-2xl sm:h-36 sm:w-36"
        style={{ background: visual.heroOrb }}
      />

      <div
        className="relative grid h-[84px] w-[84px] -rotate-[9deg] place-items-center rounded-[26px] border border-white/70 sm:h-[122px] sm:w-[122px] sm:rounded-[34px]"
        style={{
          background: `linear-gradient(155deg, rgba(255,255,255,.92) 0%, ${visual.tint}38 58%, rgba(255,255,255,.55) 100%)`,
          boxShadow: `inset 0 2px 4px rgba(255,255,255,.95), inset 0 -14px 26px -14px ${visual.tint}66, 0 24px 40px -18px ${visual.tint}88`,
        }}
      >
        <span className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-7 rounded-full bg-white/80 blur-[4px] sm:h-6 sm:w-10" />
        <span
          className="relative"
          style={{ color: visual.tint, filter: "drop-shadow(0 2px 3px rgba(255,255,255,.8))" }}
        >
          {visual.glyph("h-9 w-9 sm:h-14 sm:w-14")}
        </span>
      </div>

      {/* floating glass bubbles */}
      <GlassBubble tint={visual.tint} className="left-1 top-3 h-6 w-6 sm:left-0 sm:h-9 sm:w-9" />
      <GlassBubble tint={visual.tint} className="bottom-4 left-4 h-4 w-4 sm:bottom-6 sm:h-6 sm:w-6" />
      <GlassBubble tint={visual.tint} className="right-1 top-8 h-5 w-5 sm:right-0 sm:top-12 sm:h-8 sm:w-8" />
      <GlassBubble tint={visual.tint} className="bottom-6 right-3 h-3.5 w-3.5 sm:bottom-8 sm:right-2 sm:h-5 sm:w-5" />
    </div>
  )
}

function GlassBubble({ tint, className }: { tint: string; className: string }) {
  return (
    <span
      className={`pointer-events-none absolute rounded-full border border-white/70 ${className}`}
      style={{
        background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,.95), ${tint}55 70%)`,
        boxShadow: `inset 0 1px 2px rgba(255,255,255,.9), 0 6px 12px -6px ${tint}99`,
      }}
    />
  )
}

// ── Small building blocks ───────────────────────────────────────────────────
function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center justify-between sm:mb-4">
      <h2 className="text-[15px] font-extrabold tracking-ios text-ink sm:text-[17px]">{title}</h2>
      <button className="inline-flex items-center gap-0.5 text-[12px] font-bold text-accent hover:opacity-80">
        Barchasi <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-ink transition-colors ${
        danger ? "hover:bg-danger/10 hover:text-danger" : "hover:bg-accent/10 hover:text-accent"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-3.5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3.5">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-[16px] bg-surfaceHi/80" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-surfaceHi/80" />
            <div className="h-2.5 w-1/4 animate-pulse rounded-full bg-surfaceHi/60" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded-full bg-surfaceHi/70" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surfaceHi text-muted">
        <Search className="h-5 w-5" />
      </div>
      <p className="text-[13px] font-bold text-ink">O‘yin topilmadi</p>
      <p className="max-w-xs text-[11px] text-muted">
        {query
          ? `“${query}” bo‘yicha hech nima yo‘q. Boshqacha qidirib ko‘ring.`
          : "Hozircha bu yerda hech nima yo‘q — tez orada qayting."}
      </p>
    </div>
  )
}
