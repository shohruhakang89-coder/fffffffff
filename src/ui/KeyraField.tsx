import { Eye, EyeOff } from "lucide-react"
import { useState, type ReactNode } from "react"

interface KeyraFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  type?: "text" | "password"
  icon?: ReactNode
  error?: string | null
  autoComplete?: string
  onSubmitEnter?: () => void
}

export function KeyraField({ label, value, onChange, hint, type = "text", icon, error, autoComplete, onSubmitEnter }: KeyraFieldProps) {
  const [hidden, setHidden] = useState(true)
  const password = type === "password"
  return (
    <label className="block">
      <span className="mb-1.5 ml-0.5 block text-[11px] font-semibold text-muted">{label}</span>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <input
          type={password && hidden ? "password" : "text"}
          value={value}
          placeholder={hint}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSubmitEnter?.()}
          className={[
            "liquid-control w-full rounded-[14px] px-3.5 py-3 text-[14px] text-ink outline-none",
            "placeholder:text-muted/70 focus:ring-2 focus:ring-accent/25",
            icon ? "pl-10" : "",
            password ? "pr-11" : "",
            error ? "ring-1 ring-danger" : "",
          ].join(" ")}
        />
        {password && (
          <button type="button" aria-label={hidden ? "Show password" : "Hide password"} onClick={() => setHidden(!hidden)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <span className="ml-0.5 mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}
