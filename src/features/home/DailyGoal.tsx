import { Target } from "lucide-react"

export function DailyGoal() {
  return (
    <section className="liquid-card relative flex items-center gap-4 overflow-hidden p-3.5 sm:p-5 2xl:pr-24">
      <div className="relative z-10 grid h-16 w-16 shrink-0 place-items-center rounded-full sm:h-20 sm:w-20" style={{ background: "conic-gradient(rgb(var(--keyra-accent-rgb)) 0 72%, rgb(var(--keyra-line-rgb) / .75) 72%)" }}>
        <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-surface sm:h-[66px] sm:w-[66px]"><div className="text-center"><p className="text-[15px] font-bold text-ink sm:text-lg">72%</p><p className="text-[8px] uppercase text-muted">today</p></div></div>
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-muted">Daily focus</p>
        <h2 className="text-[15px] font-bold tracking-ios text-ink sm:text-base">Keep the rhythm</h2>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-ink"><Target className="h-3.5 w-3.5 text-accent" /> 18 of 25 min</div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/70"><div className="h-full w-[72%] rounded-full bg-accent shadow-glow" /></div>
      </div>
      <img src="/assets/glass-trophy.svg" alt="" className="theme-art absolute -bottom-5 -right-5 hidden h-28 opacity-[0.85] 2xl:block" />
    </section>
  )
}
