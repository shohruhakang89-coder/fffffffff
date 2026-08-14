// Roster of signed-in accounts for fast multi-account switching. Tokens live in
// localStorage exactly like the single active token; switching just swaps which
// one occupies the active session slot.
export interface StoredAccount {
  userId: number
  username: string
  displayName: string
  token: string
  sessionId: number
  expiresAt: number
}

const ACCOUNTS_KEY = "keyra.accounts"

export function loadAccounts(): StoredAccount[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((it): it is Record<string, unknown> => typeof it === "object" && it !== null)
      .map(toAccount)
      .filter((a) => a.userId > 0 && a.token.length > 0)
  } catch {
    return []
  }
}

export function saveAccounts(list: StoredAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list))
}

function toAccount(raw: Record<string, unknown>): StoredAccount {
  const num = (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0
  const str = (v: unknown): string => (typeof v === "string" ? v : "")
  return {
    userId: num(raw["userId"]),
    username: str(raw["username"]),
    displayName: str(raw["displayName"]) || str(raw["username"]),
    token: str(raw["token"]),
    sessionId: num(raw["sessionId"]),
    expiresAt: num(raw["expiresAt"]),
  }
}
