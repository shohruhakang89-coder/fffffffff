import { ArrowUpRight, Play, Star, UsersRound } from "lucide-react"
import { gameDescription, gameTitle, type GameManifest } from "../../models/marketplace"
import { GameCoverArt } from "./GameCoverArt"
import { marketplaceIcon } from "./marketplaceIcons"

interface Props {
  game: GameManifest
  locale: string
  onOpen: () => void
  index?: number
  variant?: "grid" | "compact" | "horizontal"
}

export function GameCard({ game, locale, onOpen, index = 0, variant = "grid" }: Props) {
  const title = gameTitle(game, locale)
  const desc = gameDescription(game, locale)
  const plays = `${(1.2 + (index * 0.7) % 3.5).toFixed(1)}k plays`
  const rating = (4.7 + (index * 0.1) % 0.3).toFixed(1)

  // ── HORIZONTAL PLAY STORE STYLE LIST ITEM (Ultra compact) ──
  if (variant === "horizontal") {
    return (
      <button
        onClick={onOpen}
        className="liquid-soft pressable group flex items-center gap-3.5 rounded-[16px] p-2.5 text-left transition-all hover:bg-surfaceHi/80"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <span
          className="glass-key grid h-12 w-12 shrink-0 place-items-center rounded-[14px] shadow-sm"
          style={{ color: game.accent }}
        >
          {marketplaceIcon(game.icon, "h-5 w-5")}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-[13px] font-bold text-ink group-hover:text-accent">
              {title}
            </h4>
            <span
              className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase ${
                game.status === "live"
                  ? "bg-mint/15 text-mint"
                  : "bg-amber/15 text-amber"
              }`}
            >
              {game.status}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted">{desc}</p>
          <div className="mt-1 flex items-center gap-3 text-[10px] font-semibold text-muted">
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {rating}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <UsersRound className="h-3 w-3" />
              {game.minPlayers}-{game.maxPlayers} p
            </span>
          </div>
        </div>

        <span className="inline-flex h-8 items-center gap-1 rounded-xl bg-accent/10 px-3 text-[11px] font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-white">
          <Play className="h-3 w-3 fill-current" /> Play
        </span>
      </button>
    )
  }

  // ── STANDARD PLAY MARKET GRID CARD WITH GRAPHIC COVER IMAGE ──
  return (
    <div
      onClick={onOpen}
      className="game-tile pressable stagger-card group relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] p-3 text-left sm:p-3.5"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Visual Banner Art Image (NO human figures, clear 3D graphic) */}
      <GameCoverArt slug={game.slug} accent={game.accent} title={title} className="h-28 w-full" />

      {/* Content details below image */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="glass-key grid h-7 w-7 shrink-0 place-items-center rounded-lg text-accent"
                style={{ color: game.accent }}
              >
                {marketplaceIcon(game.icon, "h-3.5 w-3.5")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {game.family}
              </span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase ${
                game.status === "live"
                  ? "bg-mint/15 text-mint"
                  : "bg-amber/15 text-amber"
              }`}
            >
              {game.status}
            </span>
          </div>

          <h3 className="mt-2 truncate text-[15px] font-extrabold tracking-ios text-ink group-hover:text-accent">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">
            {desc}
          </p>
        </div>

        {/* Bottom meta & action button */}
        <div className="mt-3 flex items-center justify-between border-t border-line/50 pt-2.5">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-muted">
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {rating}
            </span>
            <span>•</span>
            <span>{plays}</span>
          </div>

          <span className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-bold text-white shadow-sm transition-transform group-hover:scale-105">
            <Play className="h-3 w-3 fill-current" />
            Play
            <ArrowUpRight className="h-3 w-3 opacity-80" />
          </span>
        </div>
      </div>
    </div>
  )
}
