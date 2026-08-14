// Realtime match models, mirroring the game.* RPCs plus the room.progress and
// room.finished events. The server sends prompts only, never answers.
export interface GameResultRow {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  solved: number;
  attempts: number;
  elapsedMs: number;
  finished: boolean;
}

export interface GameRound {
  id: number;
  roomId: number;
  kind: string;
  subjectCode: string;
  level: number;
  problemCount: number;
  status: string;
  prompts: string[];
}

export interface GameSnapshot {
  round: GameRound;
  results: GameResultRow[];
}

export interface AnswerResult {
  correct: boolean;
  solved: number;
  attempts: number;
  done: boolean;
  roundFinished: boolean;
  snapshot: GameSnapshot;
}

function asInt(v: unknown, f: number): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : f;
}
function asString(v: unknown, f: string): string {
  return typeof v === "string" ? v : f;
}
function asBool(v: unknown): boolean {
  return v === true;
}
function asObject(v: unknown): Record<string, unknown> {
  return typeof v === "object" && v !== null
    ? (v as Record<string, unknown>)
    : {};
}

function resultFromJson(j: Record<string, unknown>): GameResultRow {
  return {
    userId: asInt(j["user_id"], 0),
    username: asString(j["username"], ""),
    displayName: asString(j["display_name"], ""),
    avatarUrl: asString(j["avatar_url"], ""),
    solved: asInt(j["solved"], 0),
    attempts: asInt(j["attempts"], 0),
    elapsedMs: asInt(j["elapsed_ms"], 0),
    finished: asBool(j["finished"]),
  };
}

function roundFromJson(j: Record<string, unknown>): GameRound {
  const prompts = j["prompts"];
  return {
    id: asInt(j["id"], 0),
    roomId: asInt(j["room_id"], 0),
    kind: asString(j["kind"], "math"),
    subjectCode: asString(j["subject_code"], ""),
    level: asInt(j["level"], 2),
    problemCount: asInt(j["problem_count"], 0),
    status: asString(j["status"], "running"),
    prompts: Array.isArray(prompts) ? prompts.map((p) => String(p ?? "")) : [],
  };
}

function resultList(v: unknown): GameResultRow[] {
  return Array.isArray(v)
    ? v
        .filter(
          (r): r is Record<string, unknown> =>
            typeof r === "object" && r !== null,
        )
        .map(resultFromJson)
    : [];
}

export function snapshotFromJson(data: Record<string, unknown>): GameSnapshot {
  return {
    round: roundFromJson(asObject(data["round"])),
    results: resultList(data["results"]),
  };
}

export function answerFromJson(data: Record<string, unknown>): AnswerResult {
  return {
    correct: asBool(data["correct"]),
    solved: asInt(data["solved"], 0),
    attempts: asInt(data["attempts"], 0),
    done: asBool(data["done"]),
    roundFinished: asBool(data["round_finished"]),
    snapshot: snapshotFromJson(asObject(data["state"])),
  };
}

export function resultName(r: GameResultRow): string {
  return r.displayName.trim() || r.username.trim() || "?";
}

export function roundTotal(r: GameRound): number {
  return r.problemCount > 0 ? r.problemCount : r.prompts.length;
}
