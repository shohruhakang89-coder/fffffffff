import { useState, type ReactNode } from "react"
import { Sparkles } from "lucide-react"
import { coverUrl, gameVisual, hasCover } from "./gameVisuals"

interface GameCoverArtProps {
  slug: string
  accent: string
  title: string
  className?: string
}

// Wide cover banner for a game. Uses the real generated cover art when one
// exists for the slug, and otherwise falls back to a tinted gradient panel with
// the game's glyph — so every slug, known or not, renders something clean.
export function GameCoverArt({ slug, accent, title, className = "h-28" }: GameCoverArtProps) {
  const [failed, setFailed] = useState(false)
  const visual = gameVisual(slug, accent)

  if (hasCover(slug) && !failed) {
    return (
      <div className={`relative overflow-hidden rounded-[16px] ${className}`}>
        <img
          src={coverUrl(slug)}
          alt={title}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <CoverOverlay title={title} icon={visual.glyph("h-6 w-6 text-white")} />
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[16px] p-3 shadow-inner ${className}`}
      style={{ background: visual.heroGradient }}
    >
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
      <span
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-xl"
        style={{ backgroundColor: accent }}
      />
      <div className="relative z-10 flex h-full items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 shadow-sm backdrop-blur-md">
          <span className="text-white">{visual.glyph("h-6 w-6")}</span>
        </div>
        <span className="block truncate text-[13px] font-bold text-white drop-shadow-sm">
          {title}
        </span>
      </div>
    </div>
  )
}

function CoverOverlay({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/20 bg-black/40 backdrop-blur-md">
          {icon}
        </div>
        <span className="text-[12px] font-extrabold text-white drop-shadow-sm">{title}</span>
      </div>
      <span className="inline-flex items-center gap-1 rounded-md border border-white/30 bg-white/15 px-2 py-0.5 text-[9px] font-bold text-white">
        <Sparkles className="h-2.5 w-2.5" /> TOP
      </span>
    </div>
  )
}
