import { Env } from "../../config/env"
import type { SessionStorage } from "../storage/sessionStorage"
import { ApiError } from "./apiError"
import type { LinkState } from "./linkState"
import { PendingCall, rpcError, type Json } from "./rpcEnvelope"
import { SecureSocketLink } from "./secureSocketLink"

type EventListener = (event: Json) => void
type StateListener = (state: LinkState) => void

// Every API call goes through here: sealed inside the encrypted channel,
// queued while offline, and resumed automatically after a reconnect.
export class RpcClient {
  private link: SecureSocketLink
  private inFlight = new Map<number, PendingCall>()
  private queue: PendingCall[] = []
  private eventListeners = new Set<EventListener>()
  private stateListeners = new Set<StateListener>()
  private nextId = 0

  constructor(
    private sessions: SessionStorage,
    link?: SecureSocketLink,
  ) {
    this.link = link ?? new SecureSocketLink()
    this.link.onSecured = () => this.attachSession()
    this.link.onLost = () => this.failInFlight()
    this.link.onPayload = (payload) => this.onPayload(payload)
    this.link.onState = (state) => this.stateListeners.forEach((fn) => fn(state))
  }

  get state(): LinkState {
    return this.link.state
  }

  get pinMismatch(): boolean {
    return this.link.pinMismatch
  }

  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  connect(): Promise<void> {
    return this.link.ensureSecured()
  }

  // Calls one method and waits for its answer.
  call(method: string, params: Json = {}): Promise<Json> {
    const pending = new PendingCall(++this.nextId, method, { ...params })
    this.queue.push(pending)
    void this.link.ensureSecured().then(() => this.drain())
    this.drain()
    return this.withTimeout(pending)
  }

  private withTimeout(pending: PendingCall): Promise<Json> {
    return new Promise<Json>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.inFlight.delete(pending.id)
        this.queue = this.queue.filter((call) => call !== pending)
        reject(ApiError.timeout())
      }, Env.requestTimeoutMs)
      pending.promise.then(
        (data) => {
          clearTimeout(timer)
          resolve(data)
        },
        (error) => {
          clearTimeout(timer)
          reject(error)
        },
      )
    })
  }

  private drain(): void {
    if (!this.link.isSecured) return
    const ready = this.queue
    this.queue = []
    for (const pending of ready) {
      this.inFlight.set(pending.id, pending)
      if (!this.link.send(pending.envelope)) {
        this.inFlight.delete(pending.id)
        this.queue.push(pending)
      }
    }
  }

  private onPayload(payload: Json): void {
    if (payload["t"] === "event") {
      this.eventListeners.forEach((fn) => fn(payload))
      return
    }
    const id = payload["id"]
    if (typeof id !== "number") return
    const pending = this.inFlight.get(id)
    if (!pending) return
    this.inFlight.delete(id)
    if (payload["ok"] === true) {
      const data = payload["data"]
      pending.complete(typeof data === "object" && data !== null ? (data as Json) : {})
    } else {
      pending.fail(rpcError(payload))
    }
  }

  // Re-binds the stored session token to a freshly secured channel.
  private async attachSession(): Promise<void> {
    const token = this.sessions.token
    if (!token) return
    const attach = new PendingCall(++this.nextId, "auth.attach", { session_token: token })
    this.inFlight.set(attach.id, attach)
    if (!this.link.send(attach.envelope)) {
      this.inFlight.delete(attach.id)
      return
    }
    try {
      await attach.promise
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) this.sessions.clear()
    }
  }

  private failInFlight(): void {
    for (const pending of this.inFlight.values()) {
      if (pending.method.endsWith(".get") || pending.method === "sessions.list") {
        this.queue.push(pending)
      } else {
        pending.fail(ApiError.network())
      }
    }
    this.inFlight.clear()
  }

  dispose(): void {
    this.link.dispose()
  }
}
