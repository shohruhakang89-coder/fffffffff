import { xchacha20poly1305 } from "@noble/ciphers/chacha"
import { x25519 } from "@noble/curves/ed25519"
import { randomBytes } from "@noble/hashes/utils"

import {
  b64uEncode,
  concatBytes,
  fromUtf8,
  seqBytes,
  tryB64uDecode,
  utf8,
} from "./b64"
import { deriveChannelKeys, SecureChannelError } from "./channelKeys"
import type { ChannelKeys } from "./channelKeys"
import type { ServerKey } from "./serverKey"

export { SecureChannelError }

type Json = Record<string, unknown>

// Client half of keyra-secure-channel-v1: hello -> ready, then every later
// frame is XChaCha20-Poly1305 with a per-direction key and a sequence nonce.
export class SecureChannel {
  private ephemeralSecret: Uint8Array<ArrayBufferLike> = new Uint8Array(0)
  private ephemeralPublic: Uint8Array<ArrayBufferLike> = new Uint8Array(0)
  private clientNonce: Uint8Array<ArrayBufferLike> = new Uint8Array(0)
  private keys: ChannelKeys | null = null
  private txSeq = 0
  private rxSeq = 0

  constructor(private serverKey: ServerKey) {}

  get ready(): boolean {
    return this.keys !== null
  }

  get channelId(): string {
    return this.keys?.channelId ?? ""
  }

  // First message to put on the socket.
  hello(): string {
    this.ephemeralSecret = x25519.utils.randomPrivateKey()
    this.ephemeralPublic = x25519.getPublicKey(this.ephemeralSecret)
    this.clientNonce = randomBytes(16)
    this.keys = null
    this.txSeq = 0
    this.rxSeq = 0
    return JSON.stringify({
      t: "hello",
      v: 1,
      pub: b64uEncode(this.ephemeralPublic),
      nonce: b64uEncode(this.clientNonce),
      key_id: this.serverKey.keyId,
    })
  }

  // Completes the handshake; throws when the server signature does not match.
  finish(ready: Json): void {
    if (this.ephemeralSecret.length === 0) {
      throw new SecureChannelError("not_started")
    }
    this.keys = deriveChannelKeys({
      serverKey: this.serverKey,
      ephemeralSecret: this.ephemeralSecret,
      ephemeralPublic: this.ephemeralPublic,
      clientNonce: this.clientNonce,
      ready,
    })
  }

  // Encrypts one payload into a wire frame.
  seal(payload: Json): string {
    const keys = this.keys
    if (!keys) throw new SecureChannelError("not_ready")
    const seq = ++this.txSeq
    const aead = xchacha20poly1305(keys.txKey, concatBytes(keys.txPrefix, seqBytes(seq)), seqBytes(seq))
    const sealed = aead.encrypt(utf8(JSON.stringify(payload)))
    return JSON.stringify({ t: "d", s: seq, b: b64uEncode(sealed) })
  }

  // Decrypts one wire frame, refusing replays and reordering.
  open(frame: Json): Json {
    const keys = this.keys
    const blob = tryB64uDecode(frame["b"])
    const seq = frame["s"]
    if (!keys || !blob || blob.length < 16 || typeof seq !== "number") {
      throw new SecureChannelError("bad_frame")
    }
    if (seq <= this.rxSeq) throw new SecureChannelError("bad_sequence")
    const aead = xchacha20poly1305(keys.rxKey, concatBytes(keys.rxPrefix, seqBytes(seq)), seqBytes(seq))
    let clear: Uint8Array
    try {
      clear = aead.decrypt(blob)
    } catch {
      throw new SecureChannelError("decrypt_failed")
    }
    this.rxSeq = seq
    const decoded = JSON.parse(fromUtf8(clear)) as unknown
    if (typeof decoded !== "object" || decoded === null) {
      throw new SecureChannelError("bad_envelope")
    }
    return decoded as Json
  }
}
