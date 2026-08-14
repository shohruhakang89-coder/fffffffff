// Practice catalogue models and the config passed into the typing screen.
export interface PracticeConfig {
  category: string
  lang?: string
  difficulty?: number
  title?: string
  customBody?: string
}

export function isCustom(config: PracticeConfig): boolean {
  return config.category === "custom"
}

export interface TypingText {
  id: number
  categoryCode: string
  lang: string
  difficulty: number
  body: string
  wordCount: number
  charCount: number
  source: string
  isGenerated: boolean
}

function asInt(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback
}

export function textFromJson(j: Record<string, unknown>): TypingText {
  return {
    id: asInt(j["id"], 0),
    categoryCode: asString(j["category_code"], ""),
    lang: asString(j["lang"], "en"),
    difficulty: asInt(j["difficulty"], 2),
    body: asString(j["body"], ""),
    wordCount: asInt(j["word_count"], 0),
    charCount: asInt(j["char_count"], 0),
    source: asString(j["source"], ""),
    isGenerated: j["is_generated"] === true,
  }
}

export function customText(body: string, lang: string): TypingText {
  const trimmed = body.trim()
  return {
    id: 0,
    categoryCode: "custom",
    lang,
    difficulty: 2,
    body,
    wordCount: trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length,
    charCount: body.length,
    source: "",
    isGenerated: false,
  }
}
