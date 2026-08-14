import type { Json } from "../net/rpcEnvelope"

// Persists the opaque session token so a reload or restart continues silently.
// There is no JWT and no refresh pair: one token, rotated by the server.
const TOKEN_KEY = "keyra.session_token"
const SESSION_ID_KEY = "keyra.session_id"
const EXPIRES_KEY = "keyra.session_expires"
const USERNAME_KEY = "keyra.username"

function readNumber(key: string): number {
  const raw = localStorage.getItem(key)
  const value = raw ? Number.parseInt(raw, 10) : 0
  return Number.isFinite(value) ? value : 0
}

export class SessionStorage {
  get token(): string | null {
    const value = localStorage.getItem(TOKEN_KEY) ?? ""
    return value.length === 0 ? null : value
  }

  get sessionId(): number {
    return readNumber(SESSION_ID_KEY)
  }

  // Epoch seconds; 0 when unknown.
  get expiresAt(): number {
    return readNumber(EXPIRES_KEY)
  }

  get lastUsername(): string | null {
    return localStorage.getItem(USERNAME_KEY)
  }

  get hasSession(): boolean {
    return this.token !== null
  }

  // True when the token is old enough that the app should rotate it.
  get shouldRotate(): boolean {
    const expires = this.expiresAt
    if (expires === 0) return false
    const now = Math.floor(Date.now() / 1000)
    return expires - now < 14 * 24 * 3600
  }

  save(session: Json, username?: string): void {
    const token = session["session_token"]
    if (typeof token === "string" && token.length > 0) {
      localStorage.setItem(TOKEN_KEY, token)
    }
    const id = session["session_id"]
    if (typeof id === "number") localStorage.setItem(SESSION_ID_KEY, String(id))
    const expires = session["expires_at"]
    if (typeof expires === "number") localStorage.setItem(EXPIRES_KEY, String(expires))
    if (username) localStorage.setItem(USERNAME_KEY, username)
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_ID_KEY)
    localStorage.removeItem(EXPIRES_KEY)
  }
}
