import { Award, FileText, LogOut, RefreshCw } from "lucide-react"
import type { PracticeRun } from "../../models/practiceRun"
import { runSeconds } from "../../models/practiceRun"
import { GlassCard } from "../../ui/GlassCard"
import { KeyraButton } from "../../ui/KeyraButton"

interface Props {
  run: PracticeRun
  onRetry: () => void
  onNewText: () => void
  onExit: () => void
}

// Modal summary shown when a run finishes, overlaying the completed text.
export function ResultCard({ run, onRetry, onNewText, onExit }: Props) {
  const stats = [
    { label: "Accuracy", value: `${Math.round(run.accuracy)}%` },
    { label: "Mistakes", value: run.mistakes.toString() },
    { label: "Time", value: `${runSeconds(run).toFixed(1)}s` },
    { label: "XP", value: `+${run.xpGained}` },
  ]
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-[420px]">
        <GlassCard>
          <div className="flex flex-col items-center text-center">
            {run.personalBest && (
              <span
                className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                style={{ color: "#FF9F0A", backgroundColor: "rgba(255, 159, 10, 0.15)" }}
              >
                <Award className="h-4 w-4" /> Personal best
              </span>
            )}
            <div className="text-[13px] font-semibold text-muted">Words per minute</div>
            <div className="text-gradient text-6xl font-black leading-none">{Math.round(run.wpm)}</div>
            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-xl border border-line bg-surfaceHi px-3 py-3">
                  <div className="text-lg font-bold">{item.value}</div>
                  <div className="text-[11px] text-muted">{item.label}</div>
                </div>
              ))}
            </div>
            {run.suspicious && (
              <p className="mt-4 text-xs text-danger">This run looked unusual and was flagged for review.</p>
            )}
            <div className="mt-6 flex w-full flex-col gap-3">
              <KeyraButton label="Try again" onClick={onRetry} icon={<RefreshCw className="h-[18px] w-[18px]" />} />
              <div className="flex gap-3">
                <KeyraButton label="New text" kind="ghost" onClick={onNewText} icon={<FileText className="h-[18px] w-[18px]" />} />
                <KeyraButton label="Exit" kind="ghost" onClick={onExit} icon={<LogOut className="h-[18px] w-[18px]" />} />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
