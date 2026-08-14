interface Props {
  wpm: number
  accuracy: number
  mistakes: number
  elapsedMs: number
  progress: number
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function LiveStatsBar({ wpm, accuracy, mistakes, elapsedMs, progress }: Props) {
  const items = [
    { label: "WPM", value: Math.round(wpm).toString(), color: "#0066CC" },
    { label: "ACC", value: `${Math.round(accuracy)}%`, color: "#34C759" },
    { label: "MISS", value: mistakes.toString(), color: "#FF3B30" },
    { label: "TIME", value: formatTime(elapsedMs), color: "#FF9F0A" },
  ]
  return (
    <div className="glass rounded-2xl p-4">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-xl font-extrabold" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold text-muted">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surfaceHi">
        <div
          className="h-full rounded-full transition-[width] duration-150"
          style={{ width: `${Math.round(progress * 100)}%`, backgroundImage: "var(--keyra-accent-gradient)" }}
        />
      </div>
    </div>
  )
}
