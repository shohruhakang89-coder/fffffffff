import { create } from "zustand"
import * as catalogApi from "../api/catalogApi"
import { ApiError } from "../lib/net/apiError"
import { buildTree, type CatalogCategory, type CatalogNode } from "../models/catalog"

type CatalogStatus = "idle" | "loading" | "ready" | "error"

interface CatalogStore {
  status: CatalogStatus
  categories: CatalogCategory[]
  tree: CatalogNode[]
  error: string | null
  load: (force?: boolean) => Promise<void>
}

// Loads the category tree once and shares it across every tab.
export const useCatalogStore = create<CatalogStore>((set, get) => ({
  status: "idle",
  categories: [],
  tree: [],
  error: null,
  load: async (force = false) => {
    const state = get()
    if (!force && (state.status === "ready" || state.status === "loading")) return
    set({ status: "loading", error: null })
    try {
      const categories = await catalogApi.tree()
      set({ status: "ready", categories, tree: buildTree(categories), error: null })
    } catch (error) {
      set({
        status: "error",
        error: error instanceof ApiError ? error.message : "Could not load games",
      })
    }
  },
}))
