import { ArrowUpRight, Play, Timer } from "lucide-react"

interface HomeHeroProps {
  overline: string
  title: string
  subtitle: string
  tint?: string
  onPlay: () => void
}

export function HomeHero({ overline, title, subtitle, onPlay }: HomeHeroProps) {
  return (
    <button onClick={onPlay} className="liquid-card pressable group relative min-h-[174px] w-full overflow-hidden p-4 text-left sm:min-h-[228px] sm:p-7">
      <img src="/assets/glass-keyboard.svg" alt="" className="theme-art absolute -bottom-4 -right-8 h-[168px] w-auto opacity-90 sm:-bottom-6 sm:right-0 sm:h-[238px]" />
      <div className="relative z-10 flex max-w-[62%] flex-col items-start sm:max-w-[56%]">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[.14em] text-muted"><Timer className="h-3 w-3" /> {overline}</span>
        <h2 className="mt-3 text-[24px] font-bold leading-[1.04] tracking-ios text-ink sm:mt-4 sm:text-[36px]">{title}</h2>
        <p className="mt-1.5 max-w-sm truncate text-[11px] text-muted sm:mt-2 sm:text-[13px]">{subtitle}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-[13px] bg-accent px-3 py-2.5 text-[12px] font-bold text-white shadow-glow sm:mt-5 sm:px-4">
          <Play className="h-3.5 w-3.5" fill="currentColor" /> Start
          <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
        </span>
      </div>
    </button>
  )
}
