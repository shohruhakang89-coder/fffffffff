import type { Json } from "../lib/net/rpcEnvelope"
import { runFromJson, type PracticeRun } from "../models/practiceRun"
import { textFromJson, type TypingText } from "../models/text"
import { rpc } from "../store/client"

export async function randomText(input: {
  category: string
  lang?: string
  difficulty?: number
}): Promise<TypingText | null> {
  const params: Json = { category: input.category }
  if (input.lang && input.lang.length > 0) params["lang"] = input.lang
  if (input.difficulty && input.difficulty > 0) params["difficulty"] = input.difficulty
  const data = await rpc.call("texts.random", params)
  const text = data["text"]
  return typeof text === "object" && text !== null ? textFromJson(text as Json) : null
}

export async function createCustomText(body: string, lang: string): Promise<TypingText | null> {
  const data = await rpc.call("texts.custom", { body, lang })
  const text = data["text"]
  return typeof text === "object" && text !== null ? textFromJson(text as Json) : null
}

export async function submitRun(input: {
  textId: number
  category: string
  lang: string
  correctKeys: number
  mistakes: number
  charsTyped: number
  durationMs: number
  customText: boolean
}): Promise<PracticeRun> {
  const params: Json = {
    category: input.category,
    lang: input.lang,
    mode: "text",
    correct_keys: input.correctKeys,
    mistakes: input.mistakes,
    chars_typed: input.charsTyped,
    duration_ms: input.durationMs,
    custom_text: input.customText,
  }
  if (input.textId > 0) params["text_id"] = input.textId
  return runFromJson(await rpc.call("practice.submit", params))
}

export async function myStats(): Promise<Json> {
  return rpc.call("stats.me")
}
