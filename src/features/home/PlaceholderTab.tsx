import type { ReactNode } from "react"
import { GlassCard } from "../../ui/GlassCard"

// Honest "coming in milestone X" screen: no fake data, no dead buttons.
export function PlaceholderTab({
  title,
  message,
  icon,
}: {
  title: string
  message: string
  icon: ReactNode
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <GlassCard>
          <div className="flex flex-col items-center text-center">
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl text-accent">
              <span className="absolute inset-0 rounded-2xl opacity-[0.14]" style={{ backgroundColor: "#0066CC" }} />
              <span className="relative">{icon}</span>
            </span>
            <h2 className="mt-4 text-lg font-bold">{title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">{message}</p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
