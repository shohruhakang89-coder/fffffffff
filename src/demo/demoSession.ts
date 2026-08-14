import { SessionStorage } from "../lib/storage/sessionStorage"

export class DemoSessionStorage extends SessionStorage {
  override get token(): string | null {
    return "demo-session-token"
  }

  override get sessionId(): number {
    return 1001
  }

  override get expiresAt(): number {
    return Math.floor(Date.now() / 1000) + 30 * 24 * 3600
  }

  override get lastUsername(): string | null {
    return "demo"
  }

  override get hasSession(): boolean {
    return true
  }
}
