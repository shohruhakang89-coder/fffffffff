import { BatteryFull, SignalHigh, Wifi } from "lucide-react";

// A faux iOS status bar, shown only inside the desktop demo phone frame so the
// preview reads like a real iPhone screenshot (time on the left, radios right).
export function FramedStatusBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-6 text-[14px] font-semibold text-ink">
      <span className="tracking-tight">9:41</span>
      <span className="flex items-center gap-1.5">
        <SignalHigh className="h-4 w-4" />
        <Wifi className="h-4 w-4" />
        <BatteryFull className="h-5 w-5" />
      </span>
    </div>
  );
}
