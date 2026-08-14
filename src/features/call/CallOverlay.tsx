import { useEffect, useReducer, useRef, type ReactNode } from "react"
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react"
import { useCallStore } from "./callStore"

function elapsed(startedAt: number | null): string {
  if (!startedAt) return "00:00"
  const total = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  const m = String(Math.floor(total / 60)).padStart(2, "0")
  const s = String(total % 60).padStart(2, "0")
  return `${m}:${s}`
}

export function CallOverlay() {
  const phase = useCallStore((s) => s.phase)
  const peerName = useCallStore((s) => s.peerName)
  const muted = useCallStore((s) => s.muted)
  const startedAt = useCallStore((s) => s.startedAt)
  const remoteStream = useCallStore((s) => s.remoteStream)
  const accept = useCallStore((s) => s.accept)
  const reject = useCallStore((s) => s.reject)
  const end = useCallStore((s) => s.end)
  const toggleMute = useCallStore((s) => s.toggleMute)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [, force] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    if (audioRef.current) audioRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (phase !== "active") return
    const id = window.setInterval(force, 1000)
    return () => window.clearInterval(id)
  }, [phase])

  if (phase === "idle") return null
  const status =
    phase === "outgoing"
      ? "Calling..."
      : phase === "incoming"
        ? "Incoming call"
        : phase === "connecting"
          ? "Connecting..."
          : elapsed(startedAt)
  const initial = peerName ? peerName.charAt(0).toUpperCase() : "?"

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-ink px-6 py-12 text-white">
      <audio ref={audioRef} autoPlay />
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-accent text-5xl font-semibold">
          {initial}
        </div>
        <div className="text-2xl font-semibold">{peerName || "Unknown"}</div>
        <div className="text-white/70">{status}</div>
      </div>
      <div className="flex w-full items-center justify-evenly pb-6">
        {phase === "incoming" ? (
          <>
            <CallButton icon={<PhoneOff size={28} />} color="bg-danger" onClick={() => void reject()} label="Decline" />
            <CallButton icon={<Phone size={28} />} color="bg-mint" onClick={() => void accept()} label="Accept" />
          </>
        ) : (
          <>
            <CallButton
              icon={muted ? <MicOff size={28} /> : <Mic size={28} />}
              color="bg-white/20"
              onClick={toggleMute}
              label={muted ? "Unmute" : "Mute"}
            />
            <CallButton icon={<PhoneOff size={28} />} color="bg-danger" onClick={() => void end()} label="End" />
          </>
        )}
      </div>
    </div>
  )
}

function CallButton(props: { icon: ReactNode; color: string; onClick: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={props.onClick}
        className={`flex h-16 w-16 items-center justify-center rounded-full ${props.color} text-white`}
      >
        {props.icon}
      </button>
      <span className="text-sm text-white/70">{props.label}</span>
    </div>
  )
}
