// Profile as returned by me.get / auth.login / auth.register (user field).
export interface KeyraUser {
  id: number
  username: string
  displayName: string
  locale: string
  country: string
  rating: number
  tier: string
  xp: number
  level: number
  keyboard: string
  avatarUrl: string | null
  role: string
}

function asInt(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback
}

export function userFromJson(json: Record<string, unknown>): KeyraUser {
  const username = asString(json["username"], "")
  return {
    id: asInt(json["id"], 0),
    username,
    displayName: asString(json["display_name"], username),
    locale: asString(json["locale"], "en"),
    country: asString(json["country"], ""),
    rating: asInt(json["rating"], 1000),
    tier: asString(json["tier"], "bronze"),
    xp: asInt(json["xp"], 0),
    level: asInt(json["level"], 1),
    keyboard: asString(json["keyboard"], "qwerty"),
    avatarUrl: typeof json["avatar_url"] === "string" ? (json["avatar_url"] as string) : null,
    role: asString(json["role"], "user"),
  }
}

export function userInitials(user: KeyraUser): string {
  const base = (user.displayName.trim() || user.username.trim())
  return base.length === 0 ? "?" : Array.from(base)[0].toUpperCase()
}

// Server rule: level = floor(sqrt(xp / 50)) + 1, so xpForLevel(n) = 50*(n-1)^2.
export function levelProgress(user: KeyraUser): number {
  const current = 50 * (user.level - 1) * (user.level - 1)
  const next = 50 * user.level * user.level
  if (next <= current) return 0
  return Math.min(1, Math.max(0, (user.xp - current) / (next - current)))
}

export function xpToNextLevel(user: KeyraUser): number {
  const next = 50 * user.level * user.level
  return Math.max(0, next - user.xp)
}
