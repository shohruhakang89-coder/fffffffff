import { useEffect, useState } from "react";
import { roundTotal } from "../../models/game";
import { memberName, type RoomSnapshot } from "../../models/room";
import { GameLiveBars, type BarRow } from "./GameLiveBars";
import { GamePrompt } from "./GamePrompt";
import { GameResults } from "./GameResults";
import { useGame } from "./useGame";

interface Props {
  code: string;
  snapshot: RoomSnapshot;
  myId: number;
  onLeave: () => void;
}

function subjectLabel(code: string): string {
  if (code.includes("algebra")) return "Algebra";
  if (code.includes("formula")) return "Formulas";
  return "Arithmetic";
}

// The immersive live-match screen, shown inside the room the instant the host
// starts (room.status flips to running). Players answer; observers watch.
export function GamePlayPage({ code, snapshot, myId, onLeave }: Props) {
  const game = useGame(code);
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [count]);

  if (!game.round) {
    return (
      <div className="p-8 text-center text-muted">
        {game.loading
          ? "Preparing match..."
          : (game.error ?? "Match unavailable.")}
      </div>
    );
  }

  const round = game.round;
  const total = roundTotal(round);
  const players = snapshot.members.filter((m) => m.role === "player");
  const me = snapshot.members.find((m) => m.userId === myId);
  const amPlayer = me?.role === "player";
  const finished = game.standings !== null;
  const prompt = round.prompts[game.mySolved] ?? "";

  const rows: BarRow[] = players.map((m) => {
    const solved =
      m.userId === myId ? game.mySolved : (game.others[m.userId] ?? 0);
    return {
      name: memberName(m),
      solved,
      total,
      isMe: m.userId === myId,
      finished: total > 0 && solved >= total,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-surfaceHi px-3 py-1.5 text-[13px] font-semibold text-[color:var(--keyra-text)]">
          {subjectLabel(round.subjectCode)} - Level {round.level}
        </span>
        {amPlayer && !finished && (
          <span className="text-[13px] font-bold text-accent">
            Solved {game.mySolved}/{total}
          </span>
        )}
      </div>

      {finished ? (
        <GameResults
          rows={game.standings ?? []}
          total={total}
          myId={myId}
          onLeave={onLeave}
        />
      ) : count > 0 ? (
        <div className="glass-frost p-10 text-center">
          <p className="text-6xl font-bold text-[color:var(--keyra-text)]">
            {count}
          </p>
          <p className="mt-2 text-sm text-muted">Get ready...</p>
        </div>
      ) : (
        <>
          {amPlayer && !game.myDone && (
            <GamePrompt
              prompt={prompt}
              solved={game.mySolved}
              total={total}
              attempts={game.myAttempts}
              onSubmit={game.submit}
            />
          )}
          {amPlayer && game.myDone && (
            <div className="glass p-6 text-center text-[15px] text-muted">
              Done! Waiting for the others to finish...
            </div>
          )}
          {!amPlayer && (
            <div className="glass p-6 text-center text-[15px] text-muted">
              You are watching this match.
            </div>
          )}
          <GameLiveBars rows={rows} />
        </>
      )}
    </div>
  );
}
