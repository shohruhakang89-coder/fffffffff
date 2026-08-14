import { AlertCircle } from "lucide-react"

// Inline error strip shown above auth forms.
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px] text-danger"
      style={{ backgroundColor: "rgba(255, 92, 122, 0.12)", borderColor: "rgba(255, 92, 122, 0.4)" }}
    >
      <AlertCircle className="h-[18px] w-[18px] shrink-0" />
      <span className="leading-snug">{message}</span>
    </div>
  )
}
