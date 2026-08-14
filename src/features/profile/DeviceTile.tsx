import type { ReactNode } from "react"
import { Globe, Laptop, Smartphone, Trash2 } from "lucide-react"
import type { Json } from "../../lib/net/rpcEnvelope"
import { GlassCard } from "../../ui/GlassCard"

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}

function iconFor(platform: string): ReactNode {
  const p = platform.toLowerCase()
  if (p.includes("android") || p.includes("ios") || p.includes("phone")) return <Smartphone className="h-5 w-5" />
  if (p.includes("web")) return <Globe className="h-5 w-5" />
  return <Laptop className="h-5 w-5" />
}

function relative(iso: string): string {
  if (!iso) return ""
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ""
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export function DeviceTile({
  data,
  disabled,
  onRevoke,
}: {
  data: Json
  disabled: boolean
  onRevoke: (id: number) => void
}) {
  const platform = str(data["platform"], "unknown")
  const device = str(data["device"], "Unknown device")
  const current = data["current"] === true
  const lastUsed = relative(str(data["last_used_at"]))
  const rawId = data["session_id"] ?? data["id"]
  const id = typeof rawId === "number" ? rawId : Number(rawId)
  return (
    <GlassCard padded={false} className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-surfaceHi text-muted">{iconFor(platform)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{device}</span>
            {current && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-mint"
                style={{ backgroundColor: "rgba(0, 211, 167, 0.16)" }}
              >
                This device
              </span>
            )}
          </div>
          <div className="truncate text-[12px] text-muted">
            {platform}
            {lastUsed ? ` \u00b7 ${lastUsed}` : ""}
          </div>
        </div>
        {!current && Number.isFinite(id) && (
          <button
            onClick={() => onRevoke(id)}
            disabled={disabled}
            aria-label="Revoke session"
            className="grid h-9 w-9 place-items-center rounded-lg text-danger hover:bg-surfaceHi disabled:opacity-50"
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </GlassCard>
  )
}
