import { Boxes, Compass, Gamepad2, Orbit, Trophy, type LucideIcon } from "lucide-react"

type Art = { Icon: LucideIcon; from: string; to: string; glow: string; ink: string }

// Per-category glass palette. Colours are chosen to read as lit glass objects
// on BOTH the light and dark canvas, so nothing is theme-locked.
const ART: Record<string, Art> = {
  "for-you": { Icon: Compass, from: "#f1f5f9", to: "#cbd5e1", glow: "rgba(148,163,184,.5)", ink: "#64748b" },
  games: { Icon: Gamepad2, from: "#ede9fe", to: "#c4b5fd", glow: "rgba(167,139,250,.55)", ink: "#7c3aed" },
  apps: { Icon: Boxes, from: "#e0f2fe", to: "#7dd3fc", glow: "rgba(56,189,248,.55)", ink: "#0284c7" },
  "top-charts": { Icon: Trophy, from: "#ffe4e6", to: "#fecdd3", glow: "rgba(251,113,133,.5)", ink: "#e11d48" },
  kids: { Icon: Orbit, from: "#dbeafe", to: "#93c5fd", glow: "rgba(96,165,250,.55)", ink: "#2563eb" },
}

// A stylised 3D-glass object per Play category: a frosted squircle with a tinted
// gradient, specular highlight and a coloured glyph — echoing the glassy app-store
// illustrations in the reference while staying crisp at any DPI.
export function CategoryArt({ id }: { id: string }) {
  const a = ART[id] ?? ART["for-you"]
  const Icon = a.Icon
  return (
    <div className="relative grid h-[76px] w-full place-items-center sm:h-[84px]">
      {/* tinted ambient halo */}
      <span
        className="pointer-events-none absolute h-14 w-14 rounded-full blur-xl sm:h-16 sm:w-16"
        style={{ background: a.glow }}
      />
      {/* glass squircle */}
      <span
        className="relative grid h-[52px] w-[52px] place-items-center rounded-[18px] border border-white/70 sm:h-[60px] sm:w-[60px] sm:rounded-[20px]"
        style={{
          background: `linear-gradient(150deg, ${a.from}, ${a.to})`,
          boxShadow:
            "inset 0 2px 3px rgba(255,255,255,.9), inset 0 -8px 15px -8px rgba(30,41,59,.35), 0 12px 22px -12px rgba(30,41,59,.45)",
        }}
      >
        {/* specular highlight */}
        <span className="pointer-events-none absolute left-1.5 top-1.5 h-3.5 w-5 rounded-full bg-white/75 blur-[3px]" />
        <Icon
          className="relative h-6 w-6 sm:h-7 sm:w-7"
          strokeWidth={2.1}
          style={{ color: a.ink, filter: "drop-shadow(0 1px 1px rgba(255,255,255,.7))" }}
        />
      </span>
    </div>
  )
}
