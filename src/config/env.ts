// Build-time + runtime configuration for the Keyra web client.
// Override with a .env file:  VITE_KEYRA_API_BASE=https://api.keyra.app
const API_PREFIX = "/api/v1"

const rawBase = (import.meta.env.VITE_KEYRA_API_BASE ?? "").trim()
const configuredBase = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase

// Empty base means "same origin", which lets the Vite dev proxy forward /api
// and /ws to the backend on :8080 without any CORS setup.
function resolvedBase(): string {
  if (configuredBase) return configuredBase
  if (typeof window !== "undefined") return window.location.origin
  return "http://localhost:8080"
}

export const Env = {
  appName: "Keyra",
  tagline: "Type faster. Think sharper.",
  apiPrefix: API_PREFIX,
  platformTag: "web",
  requestTimeoutMs: 20000,
  get apiBase(): string {
    return resolvedBase()
  },
  get restBase(): string {
    return `${resolvedBase()}${API_PREFIX}`
  },
  get wsBase(): string {
    return resolvedBase().replace(/^http/, "ws")
  },
} as const
