import { useEffect, useRef, type ReactNode } from "react"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { ConnectionBadge } from "../../ui/ConnectionBadge"
import { GlassCard } from "../../ui/GlassCard"
import { KeyraButton } from "../../ui/KeyraButton"
import { LiveStatsBar } from "./LiveStatsBar"
import { ResultCard } from "./ResultCard"
import { TypingView } from "./TypingView"
import type { PracticeController } from "./usePractice"

interface Props {
  title: string
  practice: PracticeController
  onExit: () => void
}

export function PracticeSurface({ title, practice, onExit }: Props) {
  const { phase, engine, typed, wpm, accuracy, mistakes, progress, elapsedMs, run, error } = practice
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typedLength = Array.from(typed).length
  const active = phase === "ready" || phase === "typing" || phase === "submitting" || phase === "done"

  useEffect(() => {
    if (phase === "ready" || phase === "typing") inputRef.current?.focus()
  }, [phase])

  return (
    <div className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between gap-3">
        <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted hover:text-[color:var(--keyra-text)]">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-bold">{title}</h1>
        <ConnectionBadge compact />
      </header>

      {phase === "loading" && <CenterNote>Loading a fresh text...</CenterNote>}
      {phase === "error" && (
        <GlassCard className="mt-8">
          <p className="text-sm text-danger">{error ?? "Something went wrong."}</p>
          <div className="mt-4">
            <KeyraButton label="Try again" kind="ghost" onClick={practice.reload} />
          </div>
        </GlassCard>
      )}

      {engine && active && (
        <>
          <div className="mt-6">
            <LiveStatsBar wpm={wpm} accuracy={accuracy} mistakes={mistakes} elapsedMs={elapsedMs} progress={progress} />
          </div>
          <div className="relative mt-6" onClick={() => inputRef.current?.focus()}>
            <TypingView engine={engine} typedLength={typedLength} />
            <textarea
              ref={inputRef}
              value={typed}
              onChange={(event) => practice.onInput(event.target.value)}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              disabled={phase === "submitting" || phase === "done"}
              aria-label="Typing input"
              className="absolute inset-0 h-full w-full cursor-text resize-none opacity-0"
            />
          </div>
          {phase !== "done" && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={practice.restart}
                className="flex items-center gap-2 rounded-xl border border-line bg-surfaceHi px-4 py-2.5 text-sm font-semibold hover:opacity-90"
              >
                <RefreshCw className="h-4 w-4" /> Restart
              </button>
            </div>
          )}
        </>
      )}

      {phase === "submitting" && (
        <CenterNote>
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Scoring your run...
        </CenterNote>
      )}
      {phase === "done" && run && (
        <ResultCard run={run} onRetry={practice.restart} onNewText={practice.reload} onExit={onExit} />
      )}
    </div>
  )
}

function CenterNote({ children }: { children: ReactNode }) {
  return <div className="mt-10 text-center text-sm text-muted">{children}</div>
}
