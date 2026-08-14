import type { Json } from "../lib/net/rpcEnvelope"
import {
  categoryFromJson,
  itemFromJson,
  type CatalogCategory,
  type CatalogItem,
} from "../models/catalog"
import { rpc } from "../store/client"

export async function tree(): Promise<CatalogCategory[]> {
  const data = await rpc.call("catalog.tree")
  const list = data["categories"]
  if (!Array.isArray(list)) return []
  return list
    .filter((it): it is Json => typeof it === "object" && it !== null)
    .map(categoryFromJson)
}

export interface SearchInput {
  q?: string
  category?: string
  gameKind?: string
  level?: number
  limit?: number
}

export async function search(input: SearchInput): Promise<CatalogItem[]> {
  const params: Json = {}
  if (input.q && input.q.trim().length > 0) params["q"] = input.q.trim()
  if (input.category) params["category"] = input.category
  if (input.gameKind) params["game_kind"] = input.gameKind
  if (input.level && input.level > 0) params["level"] = input.level
  params["limit"] = input.limit && input.limit > 0 ? input.limit : 30
  const data = await rpc.call("catalog.search", params)
  const list = data["items"]
  if (!Array.isArray(list)) return []
  return list
    .filter((it): it is Json => typeof it === "object" && it !== null)
    .map(itemFromJson)
}
