import { useCallback, useEffect, useRef, useState } from "react";
import { gameApi } from "../../api/gameApi";
import type { Json } from "../../lib/net/rpcEnvelope";
import {
  snapshotFromJson,
  type GameResultRow,
  type GameRound,
} from "../../models/game";
import { rpc } from "../../store/client";

export interface MatchState {
  loading: boolean;
  round: GameRound | null;
  mySolved: number;
  myAttempts: number;
  myDone: boolean;
  others: Record<number, number>;
  standings: GameResultRow[] | null;
  error: string | null;
}

export interface GameController extends MatchState {
  submit: (value: string) => Promise<boolean | null>;
}

const INITIAL: MatchState = {
  loading: true,
  round: null,
  mySolved: 0,
  myAttempts: 0,
  myDone: false,
  others: {},
  standings: null,
  error: null,
};

// Loads the round, tracks my own progress, and folds in room.progress /
// room.finished events -- the web mirror of the Flutter MatchController.
export function useGame(code: string): GameController {
  const [state, setState] = useState<MatchState>(INITIAL);
  const busy = useRef(false);
  const done = useRef(false);

  useEffect(() => {
    let active = true;
    gameApi
      .round(code)
      .then((snap) => {
        if (!active) return;
        const others: Record<number, number> = {};
        for (const r of snap.results) others[r.userId] = r.solved;
        setState((s) => ({
          ...s,
          loading: false,
          round: snap.round,
          others,
          standings: snap.round.status === "finished" ? snap.results : null,
        }));
      })
      .catch(() => {
        if (active)
          setState((s) => ({
            ...s,
            loading: false,
            error: "Match unavailable.",
          }));
      });
    return () => {
      active = false;
    };
  }, [code]);

  useEffect(() => {
    return rpc.onEvent((payload: Json) => {
      const ev = payload["event"];
      const data = payload["payload"];
      if (typeof data !== "object" || data === null) return;
      const body = data as Record<string, unknown>;
      if (ev === "room.progress") {
        const uid = Number(body["user_id"] ?? 0);
        if (!uid) return;
        const solved = Number(body["solved"] ?? 0);
        setState((s) => ({ ...s, others: { ...s.others, [uid]: solved } }));
      } else if (ev === "room.finished") {
        const snap = snapshotFromJson(body);
        setState((s) => ({ ...s, standings: snap.results, round: snap.round }));
      }
    });
  }, []);

  const submit = useCallback(
    async (value: string): Promise<boolean | null> => {
      const v = value.trim();
      if (busy.current || done.current || v === "") return null;
      busy.current = true;
      try {
        const res = await gameApi.answer(code, v);
        done.current = res.done;
        setState((s) => ({
          ...s,
          mySolved: res.solved,
          myAttempts: res.attempts,
          myDone: res.done,
          standings: res.roundFinished ? res.snapshot.results : s.standings,
        }));
        return res.correct;
      } catch {
        return null;
      } finally {
        busy.current = false;
      }
    },
    [code],
  );

  return { ...state, submit };
}
