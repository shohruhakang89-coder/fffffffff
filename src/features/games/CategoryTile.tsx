import { ArrowUpRight } from "lucide-react"
import { categoryTitleFor, isGroup, type CatalogNode } from "../../models/catalog"
import { catalogIcon } from "./catalogIcons"

export function CategoryTile({ node, locale, onOpen }: { node: CatalogNode; locale: string; onOpen: (node: CatalogNode) => void }) {
  const category = node.category
  return (
    <button onClick={() => onOpen(node)} className="liquid-soft pressable group flex min-h-32 items-center gap-4 rounded-[22px] p-4 text-left">
      <span className="glass-key grid h-12 w-12 shrink-0 place-items-center rounded-[16px]" style={{ color: category.accent, backgroundColor: `${category.accent}12` }}>
        {catalogIcon(category.icon, "h-5 w-5")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-ink">{categoryTitleFor(category, locale)}</span>
        <span className="mt-1 block text-[11px] text-muted">{isGroup(category) ? `${node.children.length} collections` : "Start practice"}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-accent" />
    </button>
  )
}
