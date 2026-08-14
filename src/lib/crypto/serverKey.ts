import { Env } from "../../config/env"
import { b64uEncode, tryB64uDecode } from "./b64"

const STORAGE_KEY = "keyra.server_key"

// The server identity the app pins: one Ed25519 key and one X25519 key.
export interface ServerKey {
  keyId: string
  agreementKey: Uint8Array // X25519 static public key
  signingKey: Uint8Array // Ed25519 public key
}

export function parseServerKey(data: Record<string, unknown>): ServerKey | null {
  const agreement = tryB64uDecode(data["x25519_pub"])
  const signing = tryB64uDecode(data["ed25519_pub"])
  const id = data["key_id"]
  if (!agreement || !signing || typeof id !== "string") return null
  if (agreement.length !== 32 || signing.length !== 32) return null
  return { keyId: id, agreementKey: agreement, signingKey: signing }
}

function serialize(key: ServerKey): string {
  return JSON.stringify({
    key_id: key.keyId,
    x25519_pub: b64uEncode(key.agreementKey),
    ed25519_pub: b64uEncode(key.signingKey),
  })
}

// Fetches the server key once and pins it. A changed key_id means an operator
// rotation or an attack, so we keep the pinned copy and surface a mismatch.
export class ServerKeyStore {
  private cached: ServerKey | null = null
  pinMismatch = false

  get current(): ServerKey | null {
    return this.cached
  }

  async load(force = false): Promise<ServerKey> {
    if (!force && this.cached) return this.cached
    const pinned = this.readPinned()
    const fresh = await this.fetchFresh()
    if (!fresh) {
      if (pinned) return (this.cached = pinned)
      throw new Error("server_key_unavailable")
    }
    if (pinned && pinned.keyId !== fresh.keyId) {
      this.pinMismatch = true
      return (this.cached = pinned)
    }
    this.pinMismatch = false
    localStorage.setItem(STORAGE_KEY, serialize(fresh))
    return (this.cached = fresh)
  }

  // Accepts a rotation the user explicitly confirmed.
  trustNewKey(key: ServerKey): void {
    localStorage.setItem(STORAGE_KEY, serialize(key))
    this.pinMismatch = false
    this.cached = key
  }

  private async fetchFresh(): Promise<ServerKey | null> {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), Env.requestTimeoutMs)
      const response = await fetch(`${Env.restBase}/crypto/server-key`, {
        signal: controller.signal,
      })
      clearTimeout(timer)
      const body = (await response.json()) as Record<string, unknown>
      if (body && body["ok"] === true && typeof body["data"] === "object") {
        return parseServerKey(body["data"] as Record<string, unknown>)
      }
    } catch {
      // Offline: a pinned key still lets us open the channel later.
    }
    return null
  }

  private readPinned(): ServerKey | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return parseServerKey(JSON.parse(raw) as Record<string, unknown>)
    } catch {
      return null
    }
  }
}
