import { useMemo } from "react"
import type { TypingEngine } from "./typingEngine"

const CORRECT = "#34C759"
const WRONG = "#FF3B30"

// Renders the target text with per-character coloring driven by the engine:
// mint for correct, red underline for wrong, an accent block for the caret,
// and muted for everything still pending.
export function TypingView({ engine, typedLength }: { engine: TypingEngine; typedLength: number }) {
  const chars = useMemo(
    () => Array.from({ length: engine.length }, (_, index) => engine.charAt(index)),
    [engine],
  )
  return (
    <div className="glass rounded-2xl p-6">
      <p className="font-mono-keyra select-none whitespace-pre-wrap break-words text-[19px] leading-[2.1]">
        {chars.map((char, index) => {
          const state = engine.stateAt(index)
          const isCurrent = index === typedLength
          const style =
            state === "correct"
              ? { color: CORRECT }
              : state === "wrong"
                ? { color: WRONG, textDecoration: "underline", textDecorationColor: WRONG }
                : undefined
          return (
            <span
              key={index}
              style={style}
              className={[
                state === "pending" ? "text-muted" : "",
                isCurrent ? "rounded-[3px] bg-accent/30" : "",
              ].join(" ")}
            >
              {char}
            </span>
          )
        })}
      </p>
    </div>
  )
}
