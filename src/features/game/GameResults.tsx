import { GlassCard } from "../../ui/GlassCard";
import { KeyraButton } from "../../ui/KeyraButton";
import { resultName, type GameResultRow } from "../../models/game";

interface Props {
  rows: GameResultRow[];
  total: number;
  myId: number;
  onLeave: () => void;
}

function secs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

// Final standings once the round finishes. Rows arrive pre-sorted by the server
// (solved desc, elapsed asc, attempts asc).
export function GameResults({ rows, total, myId, onLeave }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center text-lg font-bold text-[color:var(--keyra-text)]">
        Final results
      </h2>
      <GlassCard padded={false}>
        <ul className="divide-y divide-line">
          {rows.map((r, i) => (
            <li key={r.userId} className="flex items-center gap-3 px-5 py-3.5">
              <span
                className={`w-7 text-sm font-bold ${
                  i === 0 ? "text-accent" : "text-muted"
                }`}
              >
                #{i + 1}
              </span>
              <span className="flex-1 truncate text-[15px] font-semibold text-[color:var(--keyra-text)]">
                {resultName(r)}
                {r.userId === myId ? " (you)" : ""}
              </span>
              <span className="text-sm font-semibold text-[color:var(--keyra-text)]">
                {r.solved}/{total}
              </span>
              <span className="w-14 text-right text-[13px] text-muted">
                {secs(r.elapsedMs)}
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>
      <KeyraButton label="Leave room" kind="ghost" onClick={onLeave} />
    </div>
  );
}
