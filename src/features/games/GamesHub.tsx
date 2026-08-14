import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Routes } from "../../app/routes"
import { categoryTitleFor, isGroup, type CatalogItem, type CatalogNode } from "../../models/catalog"
import type { PracticeConfig } from "../../models/text"
import { useAuthStore } from "../../store/authStore"
import { useCatalogStore } from "../../store/catalogStore"
import * as catalogApi from "../../api/catalogApi"
import { CustomTextDialog } from "../practice/CustomTextDialog"
import { CategoryTile } from "./CategoryTile"
import { ExerciseList } from "./ExerciseList"
import { GamesToolbar } from "./GamesToolbar"
import { LeafBrowser } from "./LeafBrowser"
import { RoomsEntry } from "../rooms/RoomsEntry"

interface GamesHubProps {
  path?: CatalogNode[]
  onPath?: (path: CatalogNode[]) => void
  hideRootGrid?: boolean
}

// Nested category navigation + unified search + launch, the heart of the hub.
// Path may be controlled by the home screen or kept local when standalone.
export function GamesHub({ path: pathProp, onPath, hideRootGrid = false }: GamesHubProps = {}) {
  const navigate = useNavigate()
  const locale = useAuthStore((s) => s.user?.locale ?? "en")
  const { status, tree, error, load } = useCatalogStore()
  const [pathState, setPathState] = useState<CatalogNode[]>([])
  const path = pathProp ?? pathState
  const setPath = (next: CatalogNode[]) => (onPath ? onPath(next) : setPathState(next))
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState(0)
  const [results, setResults] = useState<CatalogItem[]>([])
  const [searching, setSearching] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  useEffect(() => {
    void load()
  }, [load])

  const current = path.length > 0 ? path[path.length - 1] : null
  const leaf = current && !isGroup(current.category) ? current.category : null
  const nodes = current ? current.children : tree
  const isSearch = query.trim().length >= 2

  useEffect(() => {
    if (!isSearch) {
      setResults([])
      return
    }
    let active = true
    setSearching(true)
    const timer = setTimeout(() => {
      catalogApi
        .search({ q: query, category: leaf?.code, level, limit: 30 })
        .then((r) => active && setResults(r))
        .catch(() => active && setResults([]))
        .finally(() => active && setSearching(false))
    }, 220)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, level, leaf?.code, isSearch])

  const startConfig = (config: PracticeConfig) =>
    navigate(Routes.practice, { state: config })
  const startItem = (item: CatalogItem) =>
    startConfig({ category: item.categoryCode, title: item.title, difficulty: item.level })
  const openNode = (node: CatalogNode) => {
    if (node.category.code === "custom") return setCustomOpen(true)
    setPath([...path, node])
  }

  const crumbs = useMemo(() => path.map((n) => categoryTitleFor(n.category, locale)), [path, locale])

  if (status === "idle" || status === "loading") {
    return (
      <div className="flex justify-center py-12 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  if (status === "error") {
    return <p className="py-8 text-center text-[13px] text-danger">{error}</p>
  }

  return (
    <div className="space-y-5">
      {path.length > 0 && (
        <button
          onClick={() => setPath(path.slice(0, -1))}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-[color:var(--keyra-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {crumbs.length > 1 ? crumbs[crumbs.length - 2] : "Games"}
        </button>
      )}
      <GamesToolbar query={query} onQuery={setQuery} level={level} onLevel={setLevel} showLevels={isSearch || !!leaf} />

      {path.length === 0 && !isSearch && <RoomsEntry />}

      {isSearch ? (
        <ExerciseList items={results} loading={searching} emptyLabel="Nothing found. Try another search." onStart={startItem} />
      ) : leaf ? (
        <LeafBrowser
          category={leaf}
          level={level}
          onStartCategory={() =>
            startConfig({ category: leaf.code, title: categoryTitleFor(leaf, locale), difficulty: level || undefined })
          }
          onStartItem={startItem}
        />
      ) : hideRootGrid && path.length === 0 ? null : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.map((node) => (
            <CategoryTile key={node.category.id} node={node} locale={locale} onOpen={openNode} />
          ))}
        </div>
      )}

      {customOpen && (
        <CustomTextDialog
          onClose={() => setCustomOpen(false)}
          onStart={(body) => {
            setCustomOpen(false)
            startConfig({ category: "custom", title: "My own text", customBody: body })
          }}
        />
      )}
    </div>
  )
}
