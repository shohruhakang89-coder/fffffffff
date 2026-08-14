import { useState } from "react"
import { X } from "lucide-react"
import { GlassCard } from "../../ui/GlassCard"
import { KeyraButton } from "../../ui/KeyraButton"

const MIN = 40
const MAX = 1200

// Modal for bring-your-own text; enforces the same 40-1200 bound as the server.
export function CustomTextDialog({
  onClose,
  onStart,
}: {
  onClose: () => void
  onStart: (body: string) => void
}) {
  const [body, setBody] = useState("")
  const length = Array.from(body.trim()).length
  const valid = length >= MIN && length <= MAX

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-[520px]" onClick={(event) => event.stopPropagation()}>
        <GlassCard>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Your own text</h2>
            <button onClick={onClose} aria-label="Close" className="text-muted hover:text-[color:var(--keyra-text)]">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Paste or type {MIN}-{MAX} characters to practise on.
          </p>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, MAX))}
            rows={6}
            placeholder="Paste an article, a paragraph of code, anything..."
            className="mt-4 w-full resize-none rounded-2xl border border-line bg-surfaceHi px-4 py-3 text-[14px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="mt-1.5 flex justify-between text-[12px]">
            <span className={valid || length === 0 ? "text-muted" : "text-danger"}>
              {length} / {MAX}
            </span>
            <span className="text-muted">min {MIN}</span>
          </div>
          <div className="mt-5 flex gap-3">
            <KeyraButton label="Cancel" kind="ghost" onClick={onClose} />
            <KeyraButton label="Start" onClick={valid ? () => onStart(body) : undefined} />
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
