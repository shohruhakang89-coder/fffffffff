import type { ReactNode } from "react"
import { GlassCard } from "./GlassCard"

interface StatTileProps {
  value: string
  label: string
  icon?: ReactNode
  accent?: string
  trend?: string
}

export function StatTile({ value, label, icon, accent = "#0066CC", trend }: StatTileProps) {
  return (
    <GlassCard padded={false} className="p-4">
      <div className="flex items-center justify-between">
        {icon ? (
          <span className="relative grid h-8 w-8 place-items-center rounded-lg" style={{ color: accent }}>
            <span className="absolute inset-0 rounded-lg opacity-[0.16]" style={{ backgroundColor: accent }} />
            <span className="relative">{icon}</span>
          </span>
        ) : (
          <span />
        )}
        {trend && <span className="text-xs font-semibold text-mint">{trend}</span>}
      </div>
      <div className="mt-4 text-[26px] font-extrabold leading-none tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </GlassCard>
  )
}
