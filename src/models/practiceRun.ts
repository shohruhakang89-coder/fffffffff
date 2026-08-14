// Result of one finished practice run, scored on the server.
export interface PracticeRun {
  sessionId: number
  wpm: number
  rawWpm: number
  accuracy: number
  mistakes: number
  correctKeys: number
  charsTyped: number
  durationMs: number
  xpGained: number
  suspicious: boolean
  personalBest: boolean
}

export function runFromJson(data: Record<string, unknown>): PracticeRun {
  const run =
    typeof data["run"] === "object" && data["run"] !== null
      ? (data["run"] as Record<string, unknown>)
      : data
  const d = (k: string): number => (typeof run[k] === "number" ? (run[k] as number) : 0)
  const i = (k: string): number => Math.trunc(d(k))
  return {
    sessionId: i("session_id"),
    wpm: d("wpm"),
    rawWpm: d("raw_wpm"),
    accuracy: d("accuracy"),
    mistakes: i("mistakes"),
    correctKeys: i("correct_keys"),
    charsTyped: i("chars_typed"),
    durationMs: i("duration_ms"),
    xpGained: i("xp_gained"),
    suspicious: run["suspicious"] === true,
    personalBest: run["personal_best"] === true,
  }
}

export function runSeconds(run: PracticeRun): number {
  return run.durationMs / 1000
}
