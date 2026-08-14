import { CloudOff, Loader2, Lock, ShieldAlert } from "lucide-react"
import type { ReactNode } from "react"
import type { LinkState } from "../lib/net/linkState"
import { useLinkStore } from "../store/linkStore"

function styleFor(state: LinkState): { label: string; color: string; icon: ReactNode } {
  if (state === "secured") return { label: "Encrypted", color: "#30D158", icon: <Lock className="h-3.5 w-3.5" /> }
  if (state === "connecting" || state === "handshaking") return { label: "Securing", color: "#0A84FF", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> }
  if (state === "untrusted") return { label: "Key changed", color: "#FF453A", icon: <ShieldAlert className="h-3.5 w-3.5" /> }
  return { label: "Offline", color: "#667085", icon: <CloudOff className="h-3.5 w-3.5" /> }
}

export function ConnectionBadge({ compact = false }: { compact?: boolean }) {
  const state = useLinkStore((store) => store.state)
  const style = styleFor(state)
  return (
    <span className="liquid-control inline-flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ color: style.color }}>
      {style.icon}
      {!compact && <span className="text-[10px] font-extrabold tracking-wide">{style.label}</span>}
    </span>
  )
}
