import { BorderBeam } from "border-beam"
import type { ReactNode } from "react"

type Props = {
  query: string
  onQuery: (value: string) => void
  placeholder?: string
  icon?: ReactNode
  trailing?: ReactNode
  className?: string
  size?: "sm" | "md" | "lg"
}

const SIZE_MAP = {
  sm: { minH: "min-h-[40px]", px: "px-3", gap: "gap-2", text: "text-[12px]", radius: 14 },
  md: { minH: "min-h-[52px]", px: "px-4", gap: "gap-3", text: "text-[14px]", radius: 20 },
  lg: { minH: "min-h-[56px]", px: "px-5", gap: "gap-3.5", text: "text-[15px]", radius: 24 },
}

export function LiquidSearchBar({ query, onQuery, placeholder = "Search", icon, trailing, className = "", size = "md" }: Props) {
  const s = SIZE_MAP[size]
  return (
    <BorderBeam
      size="line"
      colorVariant="ocean"
      duration={3}
      borderRadius={s.radius}
      theme="auto"
      className={`overflow-hidden ${className}`}
    >
      <label className={`play-search-input flex ${s.minH} items-center ${s.gap} overflow-hidden rounded-[${s.radius}px] ${s.px}`}>
        {icon}
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={placeholder}
          className={`min-w-0 flex-1 bg-transparent ${s.text} text-ink outline-none placeholder:text-muted/80`}
        />
        {trailing}
      </label>
    </BorderBeam>
  )
}
