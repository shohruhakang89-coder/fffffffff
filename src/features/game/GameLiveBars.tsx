export interface BarRow {
  name: string;
  solved: number;
  total: number;
  isMe: boolean;
  finished: boolean;
}

// The live scoreboard: one animated fill bar per player, shared by players and
// observers so everyone watches the same race.
export function GameLiveBars({ rows }: { rows: BarRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r, i) => (
        <Bar key={`${r.name}-${i}`} row={r} />
      ))}
    </div>
  );
}

function Bar({ row }: { row: BarRow }) {
  const pct =
    row.total === 0
      ? 0
      : Math.min(100, Math.round((row.solved / row.total) * 100));
  const fill = row.finished
    ? "var(--keyra-mint)"
    : row.isMe
      ? "var(--keyra-accent)"
      : "var(--keyra-accent-soft)";
  return (
    <div>
      <div className="flex items-center justify-between text-[13px] font-semibold">
        <span
          className={
            row.isMe
              ? "truncate text-[color:var(--keyra-text)]"
              : "truncate text-muted"
          }
        >
          {row.isMe ? `${row.name} (you)` : row.name}
        </span>
        <span className="ml-3 shrink-0 text-muted">
          {row.solved}/{row.total}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surfaceHi">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: fill }}
        />
      </div>
    </div>
  );
}
