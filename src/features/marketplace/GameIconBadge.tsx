import { useState } from "react"
import { coverUrl, gameVisual, hasCover } from "./gameVisuals"

interface GameIconBadgeProps {
  slug: string
  accent?: string
  size?: "sm" | "md" | "lg" | "xl"
}

// Vibrant 3D glass app icon for each game. When a real generated cover exists
// for the slug it is shown as the icon face (with the glassy rim + sheen kept on
// top for the iOS look); otherwise it falls back to the shared gradient + glyph.
export function GameIconBadge({ slug, accent = "#6366f1", size = "md" }: GameIconBadgeProps) {
  const [failed, setFailed] = useState(false)
  const sizeClasses = {
    sm: "h-9 w-9 rounded-[12px]",
    md: "h-12 w-12 rounded-[16px]",
    lg: "h-16 w-16 rounded-[22px]",
    xl: "h-[76px] w-[76px] rounded-[26px]",
  }
  const iconSizes = {
    sm: "h-[18px] w-[18px]",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
  }

  const visual = gameVisual(slug, accent)
  const showCover = hasCover(slug) && !failed

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden text-white transition-transform duration-300 hover:scale-105 ${sizeClasses[size]}`}
      style={{ background: visual.iconGradient, boxShadow: visual.glow }}
    >
      {showCover && (
        <img
          src={coverUrl(slug)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* diagonal gloss sweep — the classic iOS app-icon highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/40 via-white/5 to-transparent" />
      {/* soft radial sheen top-left */}
      <div className="pointer-events-none absolute -left-1/4 -top-1/3 h-2/3 w-2/3 rounded-full bg-white/30 blur-md" />
      {/* crisp bright rim + inner hairline */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/40" />
      <div className="pointer-events-none absolute inset-px rounded-[inherit] ring-1 ring-inset ring-black/10" />
      {!showCover && (
        <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,.3)]">
          {visual.glyph(iconSizes[size])}
        </span>
      )}
    </div>
  )
}
