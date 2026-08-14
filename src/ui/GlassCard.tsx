import type { CSSProperties, KeyboardEvent, ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
  padded?: boolean
}

export function GlassCard({
  children,
  className = "",
  style,
  onClick,
  padded = true,
}: GlassCardProps) {
  const interactive = onClick ? "pressable cursor-pointer" : ""
  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault()
      onClick()
    }
  }
  return (
    <div
      className={`liquid-card ${padded ? "p-5 sm:p-6" : ""} ${interactive} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKey : undefined}
    >
      {children}
    </div>
  )
}
