import { Gauge, Layers3, Zap } from "lucide-react"

export function StatsStrip({ rating, level, xp }: { rating: number; level: number; xp: number }) {
  const items = [
    { label: "Rating", value: rating.toLocaleString(), icon: <Gauge />, accent: true },
    { label: "Level", value: String(level), icon: <Layers3 />, accent: false },
    { label: "Total XP", value: xp.toLocaleString(), icon: <Zap />, accent: false },
  ]
  return (
    <div className="liquid-card grid grid-cols-3 gap-0 overflow-hidden p-1.5 sm:p-2">
      {items.map((item, index) => (
        <div key={item.label} className={`flex min-w-0 items-center justify-center gap-2 px-1 py-1.5 sm:px-3 sm:py-2 ${index > 0 ? "border-l border-line/50" : ""}`}>
          <span className={`hidden h-8 w-8 shrink-0 place-items-center rounded-[11px] bg-surface/70 sm:grid [&>svg]:h-3.5 [&>svg]:w-3.5 ${item.accent ? "text-accent" : "text-muted"}`}>{item.icon}</span>
          <span className="min-w-0 text-center sm:text-left"><span className="block truncate text-[15px] font-bold tracking-ios text-ink sm:text-base">{item.value}</span><span className="block truncate text-[9px] text-muted sm:text-[10px]">{item.label}</span></span>
        </div>
      ))}
    </div>
  )
}
