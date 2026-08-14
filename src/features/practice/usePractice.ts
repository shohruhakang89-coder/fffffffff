import { useCallback, useEffect, useRef, useState } from "react"
import * as practiceApi from "../../api/practiceApi"
import { ApiError } from "../../lib/net/apiError"
import type { PracticeRun } from "../../models/practiceRun"
import { customText, type PracticeConfig, type TypingText } from "../../models/text"
import { useAuthStore } from "../../store/authStore"
import { TypingEngine } from "./typingEngine"

export type PracticePhase = "loading" | "ready" | "typing" | "submitting" | "done" | "error"

// Headless controller for one practice session: loads a text, drives the
// engine + timer, submits the run and refreshes the profile. Mirrors the Dart
// PracticeController so both clients behave identically.
export function usePractice(config: PracticeConfig) {
  const { category, lang, difficulty, customBody } = config
  const [text, setText] = useState<TypingText | null>(null)
  const [phase, setPhase] = useState<PracticePhase>("loading")
  const [typed, setTyped] = useState("")
  const [elapsedMs, setElapsedMs] = useState(0)
  const [run, setRun] = useState<PracticeRun | null>(null)
  const [error, setError] = useState<string | null>(null)

  const engineRef = useRef<TypingEngine | null>(null)
  const startRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const refreshProfile = useAuthStore((store) => store.refreshProfile)

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const load = useCallback(async () => {
    stopTimer()
    startRef.current = null
    setTyped(""); setElapsedMs(0); setRun(null); setError(null); setPhase("loading")
    try {
      const loaded =
        category === "custom" && customBody
          ? customText(customBody, lang ?? "en")
          : await practiceApi.randomText({ category, lang, difficulty })
      if (!loaded || loaded.body.length === 0) {
        setPhase("error"); setError("No text is available for this category yet."); return
      }
      engineRef.current = new TypingEngine(loaded.body)
      setText(loaded); setPhase("ready")
    } catch (err) {
      setPhase("error")
      setError(err instanceof ApiError ? err.message : "Could not load a text.")
    }
  }, [category, lang, difficulty, customBody, stopTimer])

  const finish = useCallback(async () => {
    const engine = engineRef.current
    if (!engine || !text) return
    stopTimer()
    const elapsed = startRef.current === null ? 1 : Math.max(1, Date.now() - startRef.current)
    setElapsedMs(elapsed); setPhase("submitting")
    try {
      const result = await practiceApi.submitRun({
        textId: text.id, category, lang: text.lang,
        correctKeys: engine.correctKeys, mistakes: engine.mistakes,
        charsTyped: engine.charsTyped, durationMs: elapsed, customText: category === "custom",
      })
      setRun(result); setPhase("done"); void refreshProfile()
    } catch (err) {
      setPhase("error")
      setError(err instanceof ApiError ? err.message : "Could not save your run.")
    }
  }, [text, category, stopTimer, refreshProfile])

  const onInput = useCallback(
    (value: string) => {
      const engine = engineRef.current
      if (!engine || phase === "submitting" || phase === "done") return
      if (startRef.current === null) {
        startRef.current = Date.now()
        setPhase("typing")
        timerRef.current = window.setInterval(() => {
          if (startRef.current !== null) setElapsedMs(Date.now() - startRef.current)
        }, 100)
      }
      engine.update(value)
      setTyped(Array.from(value).slice(0, engine.length).join(""))
      if (engine.isComplete) void finish()
    },
    [phase, finish],
  )

  const restart = useCallback(() => {
    const engine = engineRef.current
    if (!engine) { void load(); return }
    stopTimer(); engine.reset(); startRef.current = null
    setTyped(""); setElapsedMs(0); setRun(null); setError(null); setPhase("ready")
  }, [load, stopTimer])

  useEffect(() => {
    void load()
    return stopTimer
  }, [load, stopTimer])

  const engine = engineRef.current
  return {
    phase, text, engine, typed, elapsedMs, run, error,
    wpm: engine ? engine.wpm(elapsedMs) : 0,
    accuracy: engine ? engine.accuracy : 100,
    mistakes: engine ? engine.mistakes : 0,
    progress: engine ? engine.progress : 0,
    onInput, restart, reload: load,
  }
}

export type PracticeController = ReturnType<typeof usePractice>
