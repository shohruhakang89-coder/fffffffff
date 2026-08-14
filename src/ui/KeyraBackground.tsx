import type { ReactNode } from "react"

export function KeyraBackground({ children }: { children: ReactNode }) {
  return (
    <div className="app-canvas relative min-h-[100dvh] overflow-x-clip">
      {/* Ambient Orbs — soft colour fields so the frosted-glass surfaces have
          something to refract. Kept subtle so the silky caustic sheen from
          .app-canvas stays the star. Strength is tuned per-theme via .ambient-orb. */}
      <div className="ambient-orb fixed top-[-12%] left-[-6%] h-[42vw] w-[42vw] rounded-full bg-sky-300/25 blur-[140px] pointer-events-none"></div>
      <div className="ambient-orb fixed bottom-[8%] right-[-8%] h-[44vw] w-[44vw] rounded-full bg-indigo-300/20 blur-[150px] pointer-events-none"></div>
      <div className="ambient-orb fixed top-[34%] left-[30%] h-[30vw] w-[30vw] rounded-full bg-violet-300/12 blur-[150px] pointer-events-none"></div>

      {/* Apple "liquid glass" lens — a subtle refractive displacement filter that
          glass buttons sample through backdrop-filter (Chrome/Edge). Safari/FF
          fall back to the specular glass alone. Mounted once here since this
          canvas wraps the whole app. */}
      <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
        <filter id="lensFilter" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.012" numOctaves="2" seed="42" result="turb" />
          <feGaussianBlur in="turb" stdDeviation="2.4" result="soft" />
          <feDisplacementMap in="SourceGraphic" in2="soft" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="relative min-h-[100dvh]">{children}</div>
    </div>
  )
}
