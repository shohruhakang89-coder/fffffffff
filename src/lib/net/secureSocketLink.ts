import { Env } from "../../config/env"
import { SecureChannel, SecureChannelError } from "../crypto/secureChannel"
import { ServerKeyStore } from "../crypto/serverKey"
import type { LinkState } from "./linkState"
import { decodeSocketJson, type Json } from "./rpcEnvelope"
import { RetryPolicy } from "./retryPolicy"

type Listener<T> = (value: T) => void

// Owns the socket and the encrypted channel: connect, handshake, reconnect.
// Everything delivered to onPayload is already decrypted; send() always seals.
export class SecureSocketLink {
  onSecured: (() => Promise<void>) | null = null
  onLost: (() => void) | null = null
  onPayload: Listener<Json> | null = null
  onState: Listener<LinkState> | null = null

  private keys = new ServerKeyStore()
  private retryPolicy = new RetryPolicy()
  private socket: WebSocket | null = null
  private channel: SecureChannel | null = null
  private opening: Promise<void> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private disposed = false
  private stateValue: LinkState = "idle"

  get state(): LinkState {
    return this.stateValue
  }

  get isSecured(): boolean {
    return this.channel?.ready === true
  }

  get pinMismatch(): boolean {
    return this.keys.pinMismatch
  }

  ensureSecured(): Promise<void> {
    if (this.isSecured || this.disposed) return Promise.resolve()
    if (!this.opening) {
      this.opening = this.open().finally(() => {
        this.opening = null
      })
    }
    return this.opening
  }

  // Seals and sends one payload; false means "not ready, try again later".
  send(payload: Json): boolean {
    const channel = this.channel
    const socket = this.socket
    if (!channel || !socket || !channel.ready) return false
    if (socket.readyState !== WebSocket.OPEN) return false
    try {
      socket.send(channel.seal(payload))
      return true
    } catch {
      return false
    }
  }

  private async open(): Promise<void> {
    try {
      this.publish("connecting")
      const key = await this.keys.load()
      if (this.keys.pinMismatch) {
        this.publish("untrusted")
        return
      }
      const channel = new SecureChannel(key)
      const socket = new WebSocket(`${Env.wsBase}/ws/v1?platform=${Env.platformTag}`)
      this.channel = channel
      this.socket = socket
      socket.onmessage = (event) => void this.onMessage(event.data, channel, socket)
      socket.onclose = () => this.drop()
      socket.onerror = () => this.drop()
      this.publish("handshaking")
    } catch {
      this.drop()
    }
  }

  private async onMessage(raw: unknown, channel: SecureChannel, socket: WebSocket): Promise<void> {
    const message = decodeSocketJson(raw)
    if (!message) return
    try {
      switch (message["t"]) {
        case "hi":
          socket.send(channel.hello())
          return
        case "ready":
          channel.finish(message)
          this.retryPolicy.reset()
          await this.onSecured?.()
          this.publish("secured")
          return
        case "d":
          this.onPayload?.(channel.open(message))
          return
        default:
          socket.close()
          this.drop()
      }
    } catch (error) {
      if (error instanceof SecureChannelError && error.code === "bad_server_signature") {
        this.publish("untrusted")
        this.disposed = true
      }
      socket.close()
      this.drop()
    }
  }

  private drop(): void {
    if (this.socket) {
      this.socket.onmessage = null
      this.socket.onclose = null
      this.socket.onerror = null
    }
    this.channel = null
    this.socket = null
    this.onLost?.()
    if (this.disposed || this.stateValue === "untrusted") return
    this.publish("offline")
    if (this.retryTimer) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      void this.ensureSecured()
    }, this.retryPolicy.next())
  }

  private publish(next: LinkState): void {
    this.stateValue = next
    this.onState?.(next)
  }

  dispose(): void {
    this.disposed = true
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.socket?.close()
  }
}
