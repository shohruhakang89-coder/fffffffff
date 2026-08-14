import { Loader2, Play } from "lucide-react"
import { GlassCard } from "../../ui/GlassCard"
import type { CatalogItem } from "../../models/catalog"

// Renders search results / leaf items with a Start action.
export function ExerciseList({
  items,
  loading,
  emptyLabel,
  onStart,
}: {
  items: CatalogItem[]
  loading: boolean
  emptyLabel: string
  onStart: (item: CatalogItem) => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }
  if (items.length === 0) {
    return <p className="py-8 text-center text-[13px] text-muted">{emptyLabel}</p>
  }
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const playable = item.gameKind === "typing"
        return (
          <GlassCard key={`${item.source}-${item.id}`} padded={false} className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold">{item.title || item.categoryCode}</p>
                <p className="truncate text-[11.5px] text-muted">{item.preview}</p>
              </div>
              <span className="shrink-0 rounded-full bg-surfaceHi px-2 py-0.5 text-[11px] text-muted">L{item.level}</span>
              <button
                onClick={() => playable && onStart(item)}
                disabled={!playable}
                className={[
                  "flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold",
                  playable ? "bg-accent text-white" : "glass cursor-not-allowed text-muted",
                ].join(" ")}
              >
                <Play className="h-3.5 w-3.5" />
                {playable ? "Start" : "Soon"}
              </button>
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}
