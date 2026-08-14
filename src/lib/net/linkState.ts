// Lifecycle of the encrypted socket, surfaced in the UI as a small badge.
export type LinkState =
  | "idle"
  | "connecting"
  | "handshaking"
  | "secured"
  | "offline"
  | "untrusted"

export function isUsable(state: LinkState): boolean {
  return state === "secured"
}

export function isBusy(state: LinkState): boolean {
  return state === "connecting" || state === "handshaking"
}

export function linkLabel(state: LinkState): string {
  switch (state) {
    case "secured":
      return "Encrypted"
    case "connecting":
      return "Connecting"
    case "handshaking":
      return "Securing"
    case "offline":
      return "Offline"
    case "untrusted":
      return "Untrusted key"
    default:
      return "Idle"
  }
}
