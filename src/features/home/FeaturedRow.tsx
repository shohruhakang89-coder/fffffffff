import { ChevronRight } from "lucide-react"
import { catalogIcon } from "../games/catalogIcons"

export interface FeaturedItem { code: string; title: string; parent: string; icon: string; accent: string }

export function FeaturedRow({ items, onStart }: { items: FeaturedItem[]; onStart: (item: FeaturedItem) => void }) {
  if (items.length === 0) return null
  return (
    <section>
      <div className="mb-2.5 flex items-end justify-between">
        <div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-muted">For you</p><h2 className="text-[16px] font-bold tracking-ios text-ink">Recommended</h2></div>
        <span className="text-[10px] text-muted">Your pace</span>
      </div>
      <div className="scroll-clean grid auto-cols-[218px] grid-flow-col gap-2.5 overflow-x-auto pb-1 md:grid-flow-row md:grid-cols-2 md:overflow-visible 2xl:grid-cols-3">
        {items.map((item, index) => (
          <button key={item.code} onClick={() => onStart(item)} className="liquid-card pressable group flex min-h-[82px] items-center gap-3 rounded-[18px] p-3 text-left">
            <span className="glass-key grid h-10 w-10 shrink-0 place-items-center rounded-[13px]" style={{ color: item.accent }}>{catalogIcon(item.icon, "h-[18px] w-[18px]")}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-ink">{item.title}</span><span className="block truncate text-[10px] text-muted">{item.parent} - {index % 2 === 0 ? "2 min" : "Focus"}</span></span>
            <ChevronRight className="h-4 w-4 text-muted/60 transition group-hover:text-accent" />
          </button>
        ))}
      </div>
    </section>
  )
}
