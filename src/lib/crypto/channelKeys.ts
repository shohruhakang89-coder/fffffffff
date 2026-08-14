import { ed25519, x25519 } from "@noble/curves/ed25519"
import { hkdf } from "@noble/hashes/hkdf"
import { sha256 } from "@noble/hashes/sha256"

import { bytesToHex, concatBytes, tryB64uDecode, utf8 } from "./b64"
import type { ServerKey } from "./serverKey"

// Raised when the peer cannot be trusted or a frame does not verify.
export class SecureChannelError extends Error {
  constructor(public code: string) {
    super(`SecureChannelError(${code})`)
    this.name = "SecureChannelError"
  }
}

const HANDSHAKE_LABEL = "keyra-handshake-v1:"
const CHANNEL_INFO = "keyra-secure-channel-v1"

// Traffic keys for one connection, derived exactly like the C++ server.
export interface ChannelKeys {
  txKey: Uint8Array
  rxKey: Uint8Array
  txPrefix: Uint8Array
  rxPrefix: Uint8Array
  channelId: string
}

export interface DeriveInput {
  serverKey: ServerKey
  ephemeralSecret: Uint8Array
  ephemeralPublic: Uint8Array
  clientNonce: Uint8Array
  ready: Record<string, unknown>
}

// Verifies the signed server reply, then runs X25519 + HKDF-SHA256, matching
// backend/src/crypto/secure_channel.cc and the Flutter client:
//   ikm  = X25519(ce, se) || X25519(ce, sStatic)
//   salt = clientNonce || serverNonce
//   okm  = 112 bytes -> key32 | key32 | prefix16 | prefix16 | channelId16
export function deriveChannelKeys(input: DeriveInput): ChannelKeys {
  const serverPublic = tryB64uDecode(input.ready["pub"])
  const serverNonce = tryB64uDecode(input.ready["nonce"])
  const signature = tryB64uDecode(input.ready["sig"])
  if (!serverPublic || !serverNonce || !signature || serverPublic.length !== 32) {
    throw new SecureChannelError("bad_ready")
  }

  const transcript = concatBytes(
    utf8(HANDSHAKE_LABEL),
    serverPublic,
    input.ephemeralPublic,
    input.clientNonce,
    serverNonce,
  )
  const trusted = ed25519.verify(signature, transcript, input.serverKey.signingKey)
  if (!trusted) throw new SecureChannelError("bad_server_signature")

  const dhEphemeral = x25519.getSharedSecret(input.ephemeralSecret, serverPublic)
  const dhStatic = x25519.getSharedSecret(input.ephemeralSecret, input.serverKey.agreementKey)
  const ikm = concatBytes(dhEphemeral, dhStatic)
  const salt = concatBytes(input.clientNonce, serverNonce)
  const okm = hkdf(sha256, ikm, salt, utf8(CHANNEL_INFO), 112)

  // The server names its own direction first, so send/receive are swapped.
  return {
    txKey: okm.slice(0, 32),
    rxKey: okm.slice(32, 64),
    txPrefix: okm.slice(64, 80),
    rxPrefix: okm.slice(80, 96),
    channelId: bytesToHex(okm.slice(96, 112)),
  }
}
