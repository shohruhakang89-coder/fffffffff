import type { ReactNode } from "react"
import {
  BrainCircuit,
  Calculator,
  Code2,
  FlaskConical,
  Gamepad2,
  Grid3X3,
  Keyboard,
  Trophy,
} from "lucide-react"

// One shared visual identity per game. The hero banner, the recommended list
// icons, the top-chart tiles and the detail view all pull from here so a game
// looks the same everywhere. Colours are chosen to read well on both the light
// and the dark canvas, so nothing is hardcoded to a single theme.
export interface GameVisual {
  /** Compact 135deg gradient for square app icons. */
  iconGradient: string
  /** Rich, cinematic gradient for the full-width hero banner. */
  heroGradient: string
  /** Soft ambient orb colour layered behind the hero glyph. */
  heroOrb: string
  /** Coloured drop-shadow for the icon badge. */
  glow: string
  /** Representative solid colour (used for rings, accents, sparkles). */
  tint: string
  /** Renders the game glyph at the given tailwind size classes. */
  glyph: (size: string) => ReactNode
}

const REGISTRY: Record<string, GameVisual> = {
  "math-rush": {
    iconGradient: "linear-gradient(150deg, #38bdf8 0%, #0284c7 52%, #0c4a6e 100%)",
    heroGradient: "linear-gradient(120deg, #0ea5e9 0%, #2563eb 46%, #4338ca 100%)",
    heroOrb: "rgba(56, 189, 248, 0.55)",
    glow: "0 12px 26px -8px rgba(2, 132, 199, 0.6)",
    tint: "#0ea5e9",
    glyph: (s) => <Calculator className={s} />,
  },
  "typing-arena": {
    iconGradient: "linear-gradient(150deg, #818cf8 0%, #4f46e5 52%, #3730a3 100%)",
    heroGradient: "linear-gradient(120deg, #6366f1 0%, #4f46e5 44%, #7c3aed 100%)",
    heroOrb: "rgba(129, 140, 248, 0.55)",
    glow: "0 12px 26px -8px rgba(79, 70, 229, 0.6)",
    tint: "#6366f1",
    glyph: (s) => <Keyboard className={s} />,
  },
  "quiz-clash": {
    iconGradient: "linear-gradient(150deg, #fbbf24 0%, #f59e0b 52%, #b45309 100%)",
    heroGradient: "linear-gradient(120deg, #f59e0b 0%, #ea580c 48%, #c026d3 100%)",
    heroOrb: "rgba(251, 191, 36, 0.5)",
    glow: "0 12px 26px -8px rgba(245, 158, 11, 0.6)",
    tint: "#f59e0b",
    glyph: (s) => <Trophy className={s} />,
  },
  "code-quest": {
    iconGradient: "linear-gradient(150deg, #2dd4bf 0%, #0d9488 52%, #115e59 100%)",
    heroGradient: "linear-gradient(120deg, #14b8a6 0%, #0891b2 46%, #4f46e5 100%)",
    heroOrb: "rgba(45, 212, 191, 0.5)",
    glow: "0 12px 26px -8px rgba(13, 148, 136, 0.6)",
    tint: "#14b8a6",
    glyph: (s) => <Code2 className={s} />,
  },
  "science-duel": {
    iconGradient: "linear-gradient(150deg, #34d399 0%, #059669 52%, #065f46 100%)",
    heroGradient: "linear-gradient(120deg, #10b981 0%, #0d9488 46%, #0369a1 100%)",
    heroOrb: "rgba(52, 211, 153, 0.5)",
    glow: "0 12px 26px -8px rgba(5, 150, 105, 0.6)",
    tint: "#10b981",
    glyph: (s) => <FlaskConical className={s} />,
  },
  "logic-lab": {
    iconGradient: "linear-gradient(150deg, #c084fc 0%, #9333ea 52%, #6b21a8 100%)",
    heroGradient: "linear-gradient(120deg, #a855f7 0%, #7c3aed 46%, #4338ca 100%)",
    heroOrb: "rgba(192, 132, 252, 0.55)",
    glow: "0 12px 26px -8px rgba(147, 51, 234, 0.6)",
    tint: "#a855f7",
    glyph: (s) => <BrainCircuit className={s} />,
  },
  "memory-grid": {
    iconGradient: "linear-gradient(150deg, #fb7185 0%, #e11d48 52%, #9f1239 100%)",
    heroGradient: "linear-gradient(120deg, #f43f5e 0%, #e11d48 46%, #a21caf 100%)",
    heroOrb: "rgba(251, 113, 133, 0.5)",
    glow: "0 12px 26px -8px rgba(225, 29, 72, 0.6)",
    tint: "#f43f5e",
    glyph: (s) => <Grid3X3 className={s} />,
  },
}

function fallback(accent: string): GameVisual {
  return {
    iconGradient: `linear-gradient(150deg, ${accent} 0%, #1e293b 100%)`,
    heroGradient: `linear-gradient(120deg, ${accent} 0%, #4338ca 100%)`,
    heroOrb: "rgba(99, 102, 241, 0.5)",
    glow: `0 12px 26px -8px ${accent}99`,
    tint: accent,
    glyph: (s) => <Gamepad2 className={s} />,
  }
}

export function gameVisual(slug: string, accent = "#6366f1"): GameVisual {
  return REGISTRY[slug] ?? fallback(accent)
}

// Real generated cover art per game slug (served as WebP from /public). Every
// game in the registry has one; unknown slugs still get a path and the caller
// falls back to the gradient visual via <img onError>.
const COVER_SLUGS = new Set(Object.keys(REGISTRY))
export function hasCover(slug: string): boolean {
  return COVER_SLUGS.has(slug)
}
export function coverUrl(slug: string): string {
  return `/assets/covers/${slug}.webp`
}
