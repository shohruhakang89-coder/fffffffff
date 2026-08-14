import { Eye, Gamepad2 } from "lucide-react"
import { memberName, type RoomMember } from "../../models/room"
import { GlassCard } from "../../ui/GlassCard"

interface Props {
  members: RoomMember[]
  myId: number
  isHost: boolean
  onSetRole: (userId: number, role: string) => void
}

function badgeClass(isHost: boolean, observer: boolean): string {
  if (isHost) return "bg-accent text-white"
  return observer ? "bg-surfaceHi text-muted" : "bg-accent/10 text-accent"
}

export function RoomMembers({ members, myId, isHost, onSetRole }: Props) {
  return (
    <GlassCard>
      <p className="mb-2 text-[15px] font-bold text-[color:var(--keyra-text)]">
        Players ({members.length})
      </p>
      <div className="flex flex-col divide-y divide-line">
        {members.map((m) => {
          const observer = m.role === "observer"
          const label = m.isHost ? "Host" : observer ? "Observer" : "Player"
          return (
            <div key={m.userId} className="flex items-center gap-3 py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surfaceHi text-[13px] font-semibold text-muted">
                {memberName(m).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[color:var(--keyra-text)]">
                  {memberName(m)}
                </p>
                <p className="truncate text-[12px] text-muted">
                  @{m.username}
                  {m.userId === myId ? " - you" : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass(m.isHost, observer)}`}
              >
                {label}
              </span>
              {isHost && m.userId !== myId && (
                <button
                  aria-label={observer ? "Make player" : "Make observer"}
                  onClick={() =>
                    onSetRole(m.userId, observer ? "player" : "observer")
                  }
                  className="text-accent"
                >
                  {observer ? (
                    <Gamepad2 className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
