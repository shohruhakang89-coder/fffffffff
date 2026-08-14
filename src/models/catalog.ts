// Game catalog: nested categories + searchable items, mirroring backend catalog.*
export interface CatalogCategory {
  id: number
  parentId: number
  code: string
  kind: string
  gameKind: string // "" => group (expandable); set => launchable leaf
  titleEn: string
  titleRu: string
  titleUz: string
  icon: string
  accent: string
  sortOrder: number
}

export interface CatalogNode {
  category: CatalogCategory
  children: CatalogNode[]
}

export interface CatalogItem {
  source: string
  id: number
  categoryCode: string
  gameKind: string
  lang: string
  level: number
  title: string
  preview: string
  authorId: number
}

function asInt(v: unknown, f: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : f
}
function asString(v: unknown, f: string): string {
  return typeof v === "string" ? v : f
}

export function categoryFromJson(j: Record<string, unknown>): CatalogCategory {
  return {
    id: asInt(j["id"], 0),
    parentId: asInt(j["parent_id"], 0),
    code: asString(j["code"], ""),
    kind: asString(j["kind"], ""),
    gameKind: asString(j["game_kind"], ""),
    titleEn: asString(j["title_en"], ""),
    titleRu: asString(j["title_ru"], ""),
    titleUz: asString(j["title_uz"], ""),
    icon: asString(j["icon"], "keyboard"),
    accent: asString(j["accent"], "#0066CC"),
    sortOrder: asInt(j["sort_order"], 100),
  }
}

export function itemFromJson(j: Record<string, unknown>): CatalogItem {
  return {
    source: asString(j["source"], "text"),
    id: asInt(j["id"], 0),
    categoryCode: asString(j["category_code"], ""),
    gameKind: asString(j["game_kind"], "typing"),
    lang: asString(j["lang"], "en"),
    level: asInt(j["level"], 2),
    title: asString(j["title"], ""),
    preview: asString(j["preview"], ""),
    authorId: asInt(j["author_id"], 0),
  }
}

export function isGroup(c: CatalogCategory): boolean {
  return c.gameKind.trim().length === 0
}

export function categoryTitleFor(c: CatalogCategory, locale: string): string {
  if (locale.startsWith("uz") && c.titleUz) return c.titleUz
  if (locale.startsWith("ru") && c.titleRu) return c.titleRu
  return c.titleEn || c.titleUz || c.titleRu || c.code
}

// Assemble the flat list into a sorted parent/child forest.
export function buildTree(cats: CatalogCategory[]): CatalogNode[] {
  const byId = new Map<number, CatalogNode>()
  for (const c of cats) byId.set(c.id, { category: c, children: [] })
  const roots: CatalogNode[] = []
  for (const node of byId.values()) {
    const parent = node.category.parentId ? byId.get(node.category.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  const sortNodes = (list: CatalogNode[]) => {
    list.sort((a, b) => a.category.sortOrder - b.category.sortOrder || a.category.id - b.category.id)
    for (const n of list) sortNodes(n.children)
  }
  sortNodes(roots)
  return roots
}

const FALLBACK: Record<string, string> = {
  prose_en: "English", prose_ru: "Russian", prose_uz: "Native language",
  prose_es: "Spanish", prose_tr: "Turkish", dictation: "Dictation",
  code_py: "Python", code_cpp: "C++", code_c: "C", code_js: "JavaScript",
  code_dart: "Dart", code_sql: "SQL", code_bash: "Bash",
  math_arith: "Arithmetic", math_algebra: "Algebra", math_formula: "Formulas",
  custom: "My own text",
}

export function fallbackCategoryTitle(code: string): string {
  return FALLBACK[code] ?? "Practice"
}
