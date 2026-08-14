import { ChevronRight, Search, SlidersHorizontal } from "lucide-react"

const FAMILIES: [string, string][] = [
  ["", "All"],
  ["subjects", "Subjects"],
  ["skills", "Skills"],
  ["logic", "Logic"],
  ["quiz", "Quiz"],
  ["memory", "Memory"],
]

const MODES: [string, string][] = [
  ["", "Any mode"],
  ["solo", "Solo"],
  ["live", "Live"],
]

interface Props {
  query: string
  family: string
  capability: string
  onQuery: (v: string) => void
  onFamily: (v: string) => void
  onCapability: (v: string) => void
}

export function MarketplaceToolbar({
  query,
  family,
  capability,
  onQuery,
  onFamily,
  onCapability,
}: Props) {
  return (
    <section className="market-toolbar rounded-[20px] p-3 sm:p-4">
      {/* Search */}
      <label className="liquid-control flex min-h-12 items-center gap-3 rounded-[15px] px-4">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search games, subjects and skills"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
        />
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-accent" />
      </label>

      {/* Filter chips */}
      <div className="chip-fade mt-3">
        <div className="scroll-clean flex gap-2 overflow-x-auto pr-12">
          {FAMILIES.map(([id, label]) => (
            <button
              key={id}
              onClick={() => onFamily(id)}
              className={`filter-chip shrink-0 rounded-full px-4 text-[11px] font-bold transition-all ${
                family === id
                  ? "bg-accent text-white shadow-glow"
                  : "bg-surfaceHi text-muted hover:bg-surfaceHi/90 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="my-2 w-px shrink-0 bg-line" />
          {MODES.map(([id, label]) => (
            <button
              key={label}
              onClick={() => onCapability(id)}
              className={`filter-chip shrink-0 rounded-full px-4 text-[11px] font-bold transition-all ${
                capability === id
                  ? "bg-ink text-surface shadow-sm"
                  : "bg-surfaceHi text-muted hover:bg-surfaceHi/90 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ChevronRight className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </section>
  )
}
