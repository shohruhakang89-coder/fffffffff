import { ShieldCheck } from "lucide-react"
import { tierColor } from "../../design/tokens"

export function TierBadge({ tier, rating }: { tier: string; rating?: number }) {
  const color = tierColor(tier)
  return (
    <span className="liquid-control inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold" style={{ color }}>
      <ShieldCheck className="h-3.5 w-3.5" />
      <span className="capitalize">{tier}</span>
      {rating !== undefined && <span className="opacity-70">- {rating}</span>}
    </span>
  )
}
