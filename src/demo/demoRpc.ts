import { ApiError } from "../lib/net/apiError"
import type { LinkState } from "../lib/net/linkState"
import type { Json } from "../lib/net/rpcEnvelope"
import * as data from "./demoData"

type EventListener = (event: Json) => void
type StateListener = (state: LinkState) => void

const latency = () => new Promise<void>((resolve) => setTimeout(resolve, 90 + Math.random() * 220))

const DAY = 86400000
const isoAgo = (msAgo: number) => new Date(Date.now() - msAgo).toISOString()

interface Problem {
  prompt: string
  answer: string
}

interface RoundState {
  code: string
  kind: string
  level: number
  problems: Problem[]
  solved: number
  attempts: number
  results: Record<string, Json>
}

interface RoomState {
  room: Json
  members: Json[]
  round: RoundState | null
  timer: ReturnType<typeof setInterval> | null
}

const INBOX_REPLIES = [
  "Good job on the drill!",
  "Want to race after lunch?",
  "I hit a new PB today 🎉",
  "Did you see the new keyboard shortcuts?",
  "That last match was so close!",
  "Can you share your routine?",
  "Same time tomorrow?",
  "I keep missing the apostrophe key 😅",
]

export class DemoRpc {
  state: LinkState = "secured"
  pinMismatch = false

  private eventListeners = new Set<EventListener>()
  private stateListeners = new Set<StateListener>()
  private chats = new Map<number, data.SeedChat>()
  private rooms = new Map<string, RoomState>()
  private nextMessageId = 1_000_000
  private nextChatId = 100
  private nextRoomId = 10
  private user: Json = { ...data.DEMO_USER }
  private simulator: ReturnType<typeof setInterval> | null = null
  private welcomeTimer: ReturnType<typeof setTimeout> | null = null
  private disposed = false

  constructor() {
    for (const chat of data.CHATS) this.chats.set(Number(chat.chat["id"]), chat)
  }

  connect(): Promise<void> {
    this.scheduleWelcome()
    if (!this.simulator) {
      this.simulator = setInterval(() => this.emitIncoming(), 11000)
    }
    this.stateListeners.forEach((fn) => fn("secured"))
    return Promise.resolve()
  }

  dispose(): void {
    this.disposed = true
    if (this.simulator) clearInterval(this.simulator)
    if (this.welcomeTimer) clearTimeout(this.welcomeTimer)
    for (const room of this.rooms.values()) {
      if (room.timer) clearInterval(room.timer)
    }
    this.simulator = null
  }

  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  async call(method: string, params: Json = {}): Promise<Json> {
    await latency()
    switch (method) {
      case "sys.ping":
        return { pong: true }
      case "auth.attach":
        return {}
      case "auth.login":
      case "auth.register":
        return { user: this.user, session: { ...data.DEMO_SESSION } }
      case "auth.logout":
        return {}
      case "auth.rotate":
        return { ...data.DEMO_SESSION }
      case "me.get":
        return { user: this.user }
      case "me.update":
        this.applyProfilePatch(params)
        return { user: this.user }
      case "me.password":
        return {}
      case "sessions.list":
        return { sessions: data.DEVICES }
      case "sessions.revoke":
      case "sessions.revoke_others":
        return {}
      case "chat.inbox":
        return { items: this.inbox() }
      case "chat.history":
        return { items: this.history(params) }
      case "chat.send":
        return { message_id: this.sendMessage(params) }
      case "chat.read":
        this.markRead(params)
        return {}
      case "chat.search":
        return { items: this.searchChats(params) }
      case "chat.create":
        return { chat_id: this.createChat(params) }
      case "chat.join":
        return { chat_id: this.joinChat(params) }
      case "chat.get":
        return this.chatById(params)
      case "chat.members":
        return { items: this.chatMembers(params) }
      case "chat.addMember":
      case "chat.removeMember":
      case "chat.leave":
        return {}
      case "catalog.tree":
        return { categories: data.CATEGORIES }
      case "catalog.search":
        return { items: this.searchCatalog(params) }
      case "texts.random":
        return { text: this.randomText(params) }
      case "texts.custom":
        return { text: this.customText(params) }
      case "practice.submit":
        return { run: this.scoreRun(params) }
      case "stats.me":
        return {
          total_runs: 412,
          avg_wpm: 78,
          best_wpm: 96,
          total_xp: 3840,
          accuracy: 96.4,
          categories: [
            { code: "prose_en", runs: 120, avg_wpm: 82 },
            { code: "prose_uz", runs: 88, avg_wpm: 74 },
            { code: "code_py", runs: 64, avg_wpm: 69 },
            { code: "dictation", runs: 41, avg_wpm: 77 },
            { code: "code_sql", runs: 30, avg_wpm: 63 },
          ],
        }
      case "game.round":
        return this.gameRound(params)
      case "game.answer":
        return this.gameAnswer(params)
      case "rooms.create":
        return this.createRoom(params)
      case "rooms.join":
        return this.joinRoom(params)
      case "rooms.leave":
        return this.leaveRoom(params)
      case "rooms.state":
        return this.roomState(params)
      case "rooms.config":
        return this.configRoom(params)
      case "rooms.setRole":
        return this.setRole(params)
      case "rooms.start":
        return this.startRoom(params)
      case "call.start":
      case "call.accept":
      case "call.reject":
      case "call.end":
      case "call.signal":
        return {}
      default:
        throw new ApiError("rpc_error", `Unknown method: ${method}`, 400)
    }
  }

  private emit(event: string, payload: Json): void {
    const frame: Json = { t: "event", event, payload }
    this.eventListeners.forEach((fn) => fn(frame))
  }

  private applyProfilePatch(params: Json): void {
    if (typeof params["display_name"] === "string") this.user["display_name"] = params["display_name"]
    if (typeof params["locale"] === "string") this.user["locale"] = params["locale"]
    if (typeof params["country"] === "string") this.user["country"] = params["country"]
    if (typeof params["keyboard"] === "string") this.user["keyboard"] = params["keyboard"]
  }

  private inbox(): Json[] {
    const items = [...this.chats.values()].map((c) => c.member)
    items.sort((a, b) => {
      const pin = (Number(a["is_pinned"]) ? 0 : 1) - (Number(b["is_pinned"]) ? 0 : 1)
      if (pin !== 0) return pin
      return String(b["last_message_at"]).localeCompare(String(a["last_message_at"]))
    })
    return items
  }

  private history(params: Json): Json[] {
    const chatId = Number(params["chat_id"] ?? 0)
    const beforeId = Number(params["before_id"] ?? 0)
    const limit = Number(params["limit"] ?? 40)
    const seed = this.chats.get(chatId)
    let items = seed ? [...seed.messages] : []
    if (beforeId > 0) items = items.filter((m) => Number(m["id"]) < beforeId)
    items.sort((a, b) => Number(b["id"]) - Number(a["id"]))
    return items.slice(0, limit)
  }

  private sendMessage(params: Json): number {
    const chatId = Number(params["chat_id"] ?? 0)
    const text = typeof params["text"] === "string" ? params["text"] : ""
    const id = this.nextMessageId++
    const seed = this.chats.get(chatId)
    const msg: Json = {
      id,
      chat_id: chatId,
      sender_id: data.DEMO_USER_ID,
      message_type: "text",
      message_text: text,
      payload: {},
      file_id: "",
      reply_to_id: 0,
      is_deleted: false,
      created_at: isoAgo(0),
    }
    if (seed) {
      seed.messages.push(msg)
      seed.member["last_message_id"] = id
      seed.member["last_message_preview"] = text
      seed.member["last_message_type"] = "text"
      seed.member["last_message_at"] = isoAgo(0)
      seed.member["last_sender_id"] = data.DEMO_USER_ID
      seed.member["last_read_message_id"] = id
      seed.member["unread_count"] = 0
    }
    this.emit("chat.message", {
      chat_id: chatId,
      message_id: id,
      sender_id: data.DEMO_USER_ID,
      type: "text",
      text,
    })
    return id
  }

  private markRead(params: Json): void {
    const chatId = Number(params["chat_id"] ?? 0)
    const messageId = Number(params["message_id"] ?? 0)
    const seed = this.chats.get(chatId)
    if (seed && messageId > 0) {
      seed.member["last_read_message_id"] = messageId
      seed.member["unread_count"] = 0
    }
  }

  private searchChats(params: Json): Json[] {
    const q = String(params["q"] ?? "").trim().toLowerCase()
    if (q.length === 0) return data.PUBLIC_CHATS.slice(0, 10)
    return data.PUBLIC_CHATS.filter((c) => {
      const hay = `${c["title"] ?? ""} ${c["username"] ?? ""} ${c["about"] ?? ""}`.toLowerCase()
      return hay.includes(q)
    }).slice(0, 10)
  }

  private createChat(params: Json): number {
    const type = String(params["type"] ?? "group")
    const title = String(params["title"] ?? "New chat")
    const username = String(params["username"] ?? "")
    const isPublic = params["is_public"] === true
    const id = this.nextChatId++
    const chat: Json = {
      id,
      type,
      title,
      username,
      about: "",
      photo_url: "",
      is_public: isPublic,
      creator_id: data.DEMO_USER_ID,
      member_count_cached: 1,
      created_at: isoAgo(0),
      peer_user_id: 0,
    }
    const member: Json = {
      chat_id: id,
      user_id: data.DEMO_USER_ID,
      role: "creator",
      joined_at: isoAgo(0),
      last_message_id: 0,
      last_message_preview: "",
      last_message_type: "text",
      last_message_at: isoAgo(0),
      last_sender_id: 0,
      last_read_message_id: 0,
      unread_count: 0,
      is_muted: false,
      is_pinned: false,
    }
    const members = [
      { user_id: data.DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "creator", joined_at: isoAgo(0) },
    ]
    this.chats.set(id, { chat, member, messages: [], members })
    return id
  }

  private joinChat(params: Json): number {
    const chatId = Number(params["chat_id"] ?? 0)
    const seed = this.chats.get(chatId)
    if (seed) {
      const known = seed.members.some((m) => Number(m["user_id"]) === data.DEMO_USER_ID)
      if (!known) {
        seed.members.push({ user_id: data.DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "member", joined_at: isoAgo(0) })
        seed.chat["member_count_cached"] = Number(seed.chat["member_count_cached"] ?? 0) + 1
      }
    }
    return chatId
  }

  private chatById(params: Json): Json {
    const chatId = Number(params["chat_id"] ?? 0)
    return this.chats.get(chatId)?.chat ?? {}
  }

  private chatMembers(params: Json): Json[] {
    const chatId = Number(params["chat_id"] ?? 0)
    return this.chats.get(chatId)?.members ?? []
  }

  private searchCatalog(params: Json): Json[] {
    const q = String(params["q"] ?? "").trim().toLowerCase()
    const category = String(params["category"] ?? "")
    const level = Number(params["level"] ?? 0)
    let items = data.CATALOG_ITEMS
    if (category) items = items.filter((i) => i["category_code"] === category)
    if (q) {
      items = items.filter((i) =>
        `${i["title"] ?? ""} ${i["preview"] ?? ""} ${i["category_code"] ?? ""}`.toLowerCase().includes(q),
      )
    }
    if (level > 0) items = items.filter((i) => i["level"] === level)
    const limit = Number(params["limit"] ?? 30)
    return items.slice(0, limit)
  }

  private randomText(params: Json): Json {
    const category = String(params["category"] ?? "prose_en")
    const lang = String(params["lang"] ?? "")
    let pool = data.TEXT_POOL.filter((t) => t.category_code === category)
    if (lang && pool.some((t) => t.lang === lang)) pool = pool.filter((t) => t.lang === lang)
    if (pool.length === 0) pool = data.TEXT_POOL.filter((t) => t.category_code === "prose_en")
    const pick = pool[Math.floor(Math.random() * pool.length)]
    return {
      id: pick.id,
      category_code: pick.category_code,
      lang: pick.lang,
      difficulty: pick.difficulty,
      body: pick.body,
      word_count: pick.body.trim().split(/\s+/).length,
      char_count: pick.body.length,
      source: pick.source,
      is_generated: false,
    }
  }

  private customText(params: Json): Json {
    const body = String(params["body"] ?? "")
    return {
      id: 0,
      category_code: "custom",
      lang: String(params["lang"] ?? "en"),
      difficulty: 2,
      body,
      word_count: body.trim().length === 0 ? 0 : body.trim().split(/\s+/).length,
      char_count: body.length,
      source: "",
      is_generated: false,
    }
  }

  private scoreRun(params: Json): Json {
    const correct = Number(params["correct_keys"] ?? 0)
    const mistakes = Number(params["mistakes"] ?? 0)
    const chars = Number(params["chars_typed"] ?? 0)
    const durationMs = Math.max(1, Number(params["duration_ms"] ?? 1))
    const minutes = durationMs / 60000
    const wpm = Math.max(1, Math.round(chars / 5 / minutes))
    const accuracy = correct + mistakes > 0 ? Math.round((correct / (correct + mistakes)) * 1000) / 10 : 100
    const xpGained = Math.round(wpm * 3 + accuracy * 0.5 + (correct / 5) * 2)
    const pb = wpm > 90 && accuracy > 97
    return {
      session_id: 5000 + Math.floor(Math.random() * 900),
      wpm,
      raw_wpm: wpm + 3,
      accuracy,
      mistakes,
      correct_keys: correct,
      chars_typed: chars,
      duration_ms: durationMs,
      xp_gained: xpGained,
      suspicious: false,
      personal_best: pb,
    }
  }

  private makeProblems(kind: string, count: number, level: number): Problem[] {
    const problems: Problem[] = []
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    for (let i = 0; i < count; i++) {
      if (kind === "math_algebra") {
        if (Math.random() < 0.5) {
          const a = rand(1, 9)
          const b = rand(1, 9)
          problems.push({ prompt: `Solve for x:  x + ${a} = ${a + b}`, answer: String(b) })
        } else {
          const a = rand(2, 9)
          const b = rand(2, 9)
          problems.push({ prompt: `Solve for x:  ${a}x = ${a * b}`, answer: String(b) })
        }
      } else if (kind === "math_formula") {
        const base = rand(2, 5)
        const exp = rand(2, 4)
        problems.push({ prompt: `Compute:  ${base}^${exp}`, answer: String(Math.pow(base, exp)) })
      } else {
        const op = Math.floor(Math.random() * 4)
        if (op === 0) {
          const a = rand(10, 99)
          const b = rand(10, 99)
          problems.push({ prompt: `${a} + ${b}`, answer: String(a + b) })
        } else if (op === 1) {
          const a = rand(10, 99)
          const b = rand(10, 99)
          problems.push({ prompt: `${Math.max(a, b)} − ${Math.min(a, b)}`, answer: String(Math.abs(a - b)) })
        } else if (op === 2) {
          const a = rand(2, 12)
          const b = rand(2, 12)
          problems.push({ prompt: `${a} × ${b}`, answer: String(a * b) })
        } else {
          const b = rand(2, 12)
          const q = rand(2, 12)
          problems.push({ prompt: `${b * q} ÷ ${b}`, answer: String(q) })
        }
      }
    }
    return problems
  }

  private roomSnapshot(room: RoomState): Json {
    return {
      room: room.room,
      members: room.members,
    }
  }

  private roomRow(userId: number, username: string, displayName: string): Json {
    return {
      user_id: userId,
      username,
      display_name: displayName,
      avatar_url: "",
      solved: 0,
      attempts: 0,
      elapsed_ms: 0,
      finished: false,
    }
  }

  private newRoom(params: Json): RoomState {
    const kind = String(params["kind"] ?? "math")
    const subjectCode = String(params["subject_code"] ?? "math_arith")
    const level = Number(params["level"] ?? 2)
    const mode = String(params["mode"] ?? "duo")
    const maxPlayers = Number(params["max_players"] ?? 8)
    const hostPlays = params["host_plays"] !== false
    const code = this.randomCode()
    const id = this.nextRoomId++
    const now = isoAgo(0)
    const room: Json = {
      id,
      code,
      host_id: data.DEMO_USER_ID,
      kind,
      subject_code: subjectCode,
      level,
      mode,
      max_players: maxPlayers,
      host_plays: hostPlays,
      status: "lobby",
      player_count: 1,
      created_at: now,
    }
    const members: Json[] = [
      { user_id: data.DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: hostPlays ? "player" : "observer", ready: true, is_host: true },
      { user_id: 1002, username: "azizbek", display_name: "Azizbek Rahimov", avatar_url: "", role: "player", ready: false, is_host: false },
      { user_id: 1003, username: "malika", display_name: "Malika Karimova", avatar_url: "", role: "player", ready: false, is_host: false },
      { user_id: 1004, username: "sardor", display_name: "Sardor Toshpulatov", avatar_url: "", role: "observer", ready: false, is_host: false },
    ]
    room["player_count"] = members.filter((m) => m["role"] === "player").length
    return { room, members, round: null, timer: null }
  }

  private randomCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let code = ""
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  private createRoom(params: Json): Json {
    const room = this.newRoom(params)
    this.rooms.set(String(room.room["code"]), room)
    return this.roomSnapshot(room)
  }

  private joinRoom(params: Json): Json {
    const code = String(params["code"] ?? "").toUpperCase()
    const room = this.rooms.get(code)
    if (!room) return { room: { id: 0, code }, members: [] }
    const known = room.members.some((m) => Number(m["user_id"]) === data.DEMO_USER_ID)
    if (!known) {
      room.members.push({ user_id: data.DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "player", ready: true, is_host: false })
      room.room["player_count"] = room.members.filter((m) => m["role"] === "player").length
    }
    this.emit("room.updated", this.roomSnapshot(room))
    return this.roomSnapshot(room)
  }

  private leaveRoom(params: Json): Json {
    const code = String(params["code"] ?? "").toUpperCase()
    const room = this.rooms.get(code)
    if (!room) return { room: { id: 0, code }, members: [] }
    this.stopRound(room)
    this.rooms.delete(code)
    return { room: { id: 0, code }, members: [] }
  }

  private roomState(params: Json): Json {
    const code = String(params["code"] ?? "").toUpperCase()
    if (!this.rooms.has(code) && code === "ABC123") {
      const seeded = this.newRoom({ kind: "math", subject_code: "math_arith", level: 2, mode: "duo", max_players: 8, host_plays: true })
      seeded.room["code"] = "ABC123"
      this.rooms.set("ABC123", seeded)
    }
    const room = this.rooms.get(code)
    if (!room) return { room: { id: 0, code }, members: [] }
    return this.roomSnapshot(room)
  }

  private configRoom(params: Json): Json {
    const code = String(params["code"] ?? "").toUpperCase()
    const room = this.rooms.get(code)
    if (!room) return { room: { id: 0, code }, members: [] }
    const patch = room.room
    if (typeof params["level"] === "number") patch["level"] = params["level"]
    if (typeof params["mode"] === "string") patch["mode"] = params["mode"]
    if (typeof params["max_players"] === "number") patch["max_players"] = params["max_players"]
    if (typeof params["host_plays"] === "boolean") patch["host_plays"] = params["host_plays"]
    this.emit("room.updated", this.roomSnapshot(room))
    return this.roomSnapshot(room)
  }

  private setRole(params: Json): Json {
    const code = String(params["code"] ?? "").toUpperCase()
    const room = this.rooms.get(code)
    if (!room) return { room: { id: 0, code }, members: [] }
    const role = String(params["role"] ?? "player")
    const userId = Number(params["user_id"] ?? data.DEMO_USER_ID)
    const member = room.members.find((m) => Number(m["user_id"]) === userId)
    if (member) member["role"] = role
    room.room["player_count"] = room.members.filter((m) => m["role"] === "player").length
    this.emit("room.updated", this.roomSnapshot(room))
    return this.roomSnapshot(room)
  }

  private startRoom(params: Json): Json {
    const code = String(params["code"] ?? "").toUpperCase()
    const room = this.rooms.get(code)
    if (!room) return { room: { id: 0, code }, members: [] }
    room.room["status"] = "running"
    room.round = this.buildRound(room)
    this.startOpponents(room)
    this.emit("room.updated", this.roomSnapshot(room))
    return this.roomSnapshot(room)
  }

  private buildRound(room: RoomState): RoundState {
    const subjectCode = String(room.room["subject_code"] ?? "math_arith")
    const level = Number(room.room["level"] ?? 2)
    const count = level >= 3 ? 8 : level === 2 ? 6 : 4
    const problems = this.makeProblems(subjectCode, count, level)
    const results: Record<string, Json> = {}
    for (const member of room.members) {
      const userId = Number(member["user_id"])
      results[String(userId)] = this.roomRow(userId, String(member["username"]), String(member["display_name"]))
    }
    return { code: String(room.room["code"]), kind: subjectCode, level, problems, solved: 0, attempts: 0, results }
  }

  private startOpponents(room: RoomState): void {
    if (room.timer) clearInterval(room.timer)
    const round = room.round
    if (!round) return
    const opponents = room.members.filter((m) => Number(m["user_id"]) !== data.DEMO_USER_ID && m["role"] === "player")
    if (opponents.length === 0) return
    room.timer = setInterval(() => {
      if (this.disposed || !room.round) return
      const target = opponents[Math.floor(Math.random() * opponents.length)]
      const row = round.results[String(Number(target["user_id"]))]
      if (!row || Number(row["solved"]) >= round.problems.length) return
      row["solved"] = Number(row["solved"]) + 1
      row["elapsed_ms"] = Math.round((Date.now() - this.roundStart) * 0.4)
      if (Number(row["solved"]) >= round.problems.length) row["finished"] = true
      this.emit("room.progress", { user_id: Number(target["user_id"]), solved: Number(row["solved"]) })
      const finishedCount = Object.values(round.results).filter((r) => Number(r["finished"])).length
      if (finishedCount >= opponents.length) this.finishRound(room)
    }, 2600)
    this.roundStart = Date.now()
  }

  private roundStart = 0

  private stopRound(room: RoomState): void {
    if (room.timer) clearInterval(room.timer)
    room.timer = null
  }

  private finishRound(room: RoomState): void {
    this.stopRound(room)
    const round = room.round
    if (!round) return
    const results = Object.values(round.results).sort((a, b) => {
      const solved = Number(b["solved"]) - Number(a["solved"])
      if (solved !== 0) return solved
      return Number(a["elapsed_ms"]) - Number(b["elapsed_ms"])
    })
    const snapshot: Json = {
      round: {
        id: 1,
        room_id: Number(room.room["id"]),
        kind: round.kind,
        subject_code: String(room.room["subject_code"] ?? "math_arith"),
        level: round.level,
        problem_count: round.problems.length,
        status: "finished",
        prompts: round.problems.map((p) => p.prompt),
      },
      results,
    }
    room.room["status"] = "finished"
    this.emit("room.finished", snapshot)
  }

  private gameRound(params: Json): Json {
    const code = String(params["code"] ?? "").toUpperCase()
    let room = this.rooms.get(code)
    if (!room) {
      room = this.newRoom({ kind: "math", subject_code: "math_arith", level: 2, mode: "duo", max_players: 8, host_plays: true })
      room.room["code"] = code
      room.room["status"] = "running"
      room.round = this.buildRound(room)
      this.startOpponents(room)
      this.rooms.set(code, room)
    }
    if (!room.round) room.round = this.buildRound(room)
    return this.roundSnapshot(room.round)
  }

  private roundSnapshot(round: RoundState): Json {
    return {
      round: {
        id: 1,
        room_id: 0,
        kind: round.kind,
        subject_code: round.kind,
        level: round.level,
        problem_count: round.problems.length,
        status: round.solved >= round.problems.length ? "finished" : "running",
        prompts: round.problems.map((p) => p.prompt),
      },
      results: Object.values(round.results).sort((a, b) => Number(b["solved"]) - Number(a["solved"])),
    }
  }

  private gameAnswer(params: Json): Json {
    const code = String(params["code"] ?? "").toUpperCase()
    const value = String(params["value"] ?? "").trim()
    const room = this.rooms.get(code)
    let round = room?.round
    if (!room) {
      const solo = this.newRoom({ kind: "math", subject_code: "math_arith", level: 2, mode: "duo", max_players: 8, host_plays: true })
      solo.room["code"] = code
      solo.room["status"] = "running"
      solo.round = this.buildRound(solo)
      this.rooms.set(code, solo)
      round = solo.round
    }
    if (!round) throw new ApiError("rpc_error", "No active round", 400)
    if (round.solved >= round.problems.length) {
      return { correct: false, solved: round.solved, attempts: round.attempts, done: true, round_finished: true, state: this.roundSnapshot(round) }
    }
    const problem = round.problems[round.solved]
    const correct = this.compareAnswer(value, problem.answer)
    const myRow = round.results[String(data.DEMO_USER_ID)] ?? this.roomRow(data.DEMO_USER_ID, "demo", "Demo Player")
    round.results[String(data.DEMO_USER_ID)] = myRow
    if (correct) {
      round.solved += 1
      myRow["solved"] = round.solved
      myRow["elapsed_ms"] = Math.round((Date.now() - this.roundStart) * 0.6)
      if (round.solved >= round.problems.length) {
        myRow["finished"] = true
        this.finishRound(room!)
      }
    } else {
      round.attempts += 1
      myRow["attempts"] = round.attempts
    }
    const done = round.solved >= round.problems.length
    const finished = room?.room["status"] === "finished" || done
    return {
      correct,
      solved: round.solved,
      attempts: round.attempts,
      done,
      round_finished: finished,
      state: this.roundSnapshot(round),
    }
  }

  private compareAnswer(value: string, answer: string): boolean {
    const clean = value.replace(/\s+/g, " ")
    const a = Number(answer)
    if (Number.isFinite(a) && Number.isFinite(Number(clean))) {
      return Math.abs(Number(clean) - a) < 0.0001
    }
    return clean.toLowerCase() === answer.toLowerCase()
  }

  private scheduleWelcome(): void {
    if (this.welcomeTimer || this.disposed) return
    const timeline = [
      { chat_id: 1, sender_id: 1002, text: "Hey! Up for a quick race later?" },
      { chat_id: 5, sender_id: 1003, text: "New drill is live in the hub, check it out" },
      { chat_id: 7, sender_id: 2, text: "Reminder: league qualifiers close at midnight" },
    ]
    this.welcomeTimer = setTimeout(() => {
      this.welcomeTimer = null
      if (this.disposed) return
      const pick = timeline[Math.floor(Math.random() * timeline.length)]
      this.appendIncoming(pick.chat_id, pick.sender_id, pick.text)
    }, 4500)
  }

  private emitIncoming(): void {
    if (this.disposed) return
    const chat = this.chats.get(1 + Math.floor(Math.random() * 8))
    if (!chat) return
    const chatId = Number(chat.chat["id"])
    const privatePeer = Number(chat.chat["peer_user_id"] ?? 0)
    const candidates = chat.members.filter((m) => Number(m["user_id"]) !== data.DEMO_USER_ID)
    if (candidates.length === 0) return
    const sender = privatePeer > 0 ? candidates.find((m) => Number(m["user_id"]) === privatePeer) ?? candidates[0] : candidates[Math.floor(Math.random() * candidates.length)]
    const text = INBOX_REPLIES[Math.floor(Math.random() * INBOX_REPLIES.length)]
    this.appendIncoming(chatId, Number(sender["user_id"]), text)
  }

  private appendIncoming(chatId: number, senderId: number, text: string): void {
    const seed = this.chats.get(chatId)
    if (!seed) return
    const id = this.nextMessageId++
    const msg: Json = {
      id,
      chat_id: chatId,
      sender_id: senderId,
      message_type: "text",
      message_text: text,
      payload: {},
      file_id: "",
      reply_to_id: 0,
      is_deleted: false,
      created_at: isoAgo(0),
    }
    seed.messages.push(msg)
    seed.member["last_message_id"] = id
    seed.member["last_message_preview"] = text
    seed.member["last_message_type"] = "text"
    seed.member["last_message_at"] = isoAgo(0)
    seed.member["last_sender_id"] = senderId
    seed.member["unread_count"] = Number(seed.member["unread_count"] ?? 0) + 1
    this.emit("chat.message", {
      chat_id: chatId,
      message_id: id,
      sender_id: senderId,
      type: "text",
      text,
    })
  }
}
