import { ChevronRight } from "lucide-react"
import { categoryTitleFor, type CatalogNode } from "../../models/catalog"
import { catalogIcon } from "../games/catalogIcons"

interface QuickCategoriesProps {
  nodes: CatalogNode[]
  locale: string
  onOpen: (node: CatalogNode) => void
  onSeeAll?: () => void
}

export function QuickCategories({ nodes, locale, onOpen, onSeeAll }: QuickCategoriesProps) {
  if (nodes.length === 0) return <div className="liquid-card h-36 animate-pulse" />
  return (
    <section className="liquid-card p-3.5 sm:p-5">
      <div className="mb-3 flex items-end justify-between">
        <div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-muted">Library</p><h2 className="text-[16px] font-bold tracking-ios text-ink">Categories</h2></div>
        {onSeeAll && <button onClick={onSeeAll} className="text-[11px] font-semibold text-accent">See all</button>}
      </div>
      <div className="scroll-clean -mx-0.5 grid auto-cols-[108px] grid-flow-col gap-2 overflow-x-auto px-0.5 pb-0.5 xl:grid-flow-row xl:grid-cols-2 xl:overflow-visible">
        {nodes.slice(0, 6).map((node) => {
          const category = node.category
          return (
            <button key={category.id} onClick={() => onOpen(node)} className="liquid-soft pressable group flex min-h-[92px] flex-col justify-between rounded-[16px] p-2.5 text-left xl:min-h-[96px]">
              <span className="flex items-start justify-between">
                <span className="glass-key grid h-8 w-8 place-items-center rounded-[10px]" style={{ color: category.accent }}>{catalogIcon(category.icon, "h-4 w-4")}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted/60" />
              </span>
              <span><span className="block truncate text-[12px] font-semibold text-ink">{categoryTitleFor(category, locale)}</span><span className="block text-[9px] text-muted">{node.children.length || 1} sets</span></span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
