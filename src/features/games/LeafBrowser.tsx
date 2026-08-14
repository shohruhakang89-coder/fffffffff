import { useEffect, useState } from "react"
import { Shuffle } from "lucide-react"
import * as catalogApi from "../../api/catalogApi"
import type { CatalogCategory, CatalogItem } from "../../models/catalog"
import { KeyraButton } from "../../ui/KeyraButton"
import { ExerciseList } from "./ExerciseList"

// A launchable category: quick random start + a level-filtered item list.
export function LeafBrowser({
  category,
  level,
  onStartCategory,
  onStartItem,
}: {
  category: CatalogCategory
  level: number
  onStartCategory: () => void
  onStartItem: (item: CatalogItem) => void
}) {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const typing = category.gameKind === "typing"

  useEffect(() => {
    let active = true
    setLoading(true)
    catalogApi
      .search({ category: category.code, level, limit: 40 })
      .then((res) => { if (active) setItems(res) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [category.code, level])

  return (
    <div className="space-y-4">
      {typing && (
        <KeyraButton
          kind="primary"
          icon={<Shuffle className="h-4 w-4" />}
          label="Start a random drill"
          onClick={onStartCategory}
        />
      )}
      <ExerciseList
        items={items}
        loading={loading}
        emptyLabel={typing ? "No exercises match yet." : "This game arrives in the next milestone."}
        onStart={onStartItem}
      />
    </div>
  )
}
