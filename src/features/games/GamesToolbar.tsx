import { Search, SlidersHorizontal, X } from "lucide-react"
import { LiquidSearchBar } from "../../ui/LiquidSearchBar"

const LEVELS = [0, 1, 2, 3, 4, 5]

export function GamesToolbar({ query, onQuery, level, onLevel, showLevels }: { query: string; onQuery: (value: string) => void; level: number; onLevel: (value: number) => void; showLevels: boolean }) {
  return (
    <div className="space-y-3">
      <LiquidSearchBar
        query={query}
        onQuery={onQuery}
        placeholder="Search games and practice sets"
        icon={<Search className="h-4 w-4 text-muted" />}
        trailing={query ? <button onClick={() => onQuery("")} className="text-muted hover:text-ink"><X className="h-4 w-4" /></button> : undefined}
        size="sm"
      />
      {showLevels && (
        <div className="scroll-clean flex items-center gap-2 overflow-x-auto pb-1">
          <span className="glass-key grid h-8 w-8 shrink-0 place-items-center rounded-[11px] text-muted"><SlidersHorizontal className="h-3.5 w-3.5" /></span>
          {LEVELS.map((value) => (
            <button key={value} onClick={() => onLevel(value)} className={`pressable shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${level === value ? "bg-accent text-white shadow-glow" : "liquid-control text-muted"}`}>
              {value === 0 ? "Any level" : `Level ${value}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
