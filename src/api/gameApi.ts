import {
  answerFromJson,
  snapshotFromJson,
  type AnswerResult,
  type GameSnapshot,
} from "../models/game";
import { rpc } from "../store/client";

// Talks to the game.* RPCs for one live match round.
export const gameApi = {
  round: async (code: string): Promise<GameSnapshot> =>
    snapshotFromJson(await rpc.call("game.round", { code })),
  answer: async (code: string, value: string): Promise<AnswerResult> =>
    answerFromJson(await rpc.call("game.answer", { code, value })),
};
