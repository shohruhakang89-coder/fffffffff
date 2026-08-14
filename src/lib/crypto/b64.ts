// base64url without padding + big-endian sequence bytes: the Keyra wire format.
const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function utf8(text: string): Uint8Array {
  return encoder.encode(text)
}

export function fromUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes)
}

export function b64uEncode(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function b64uDecode(value: string): Uint8Array {
  const pad = (4 - (value.length % 4)) % 4
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad)
  const binary = atob(normalized)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return out
}

export function tryB64uDecode(value: unknown): Uint8Array | null {
  if (typeof value !== "string" || value.length === 0) return null
  try {
    return b64uDecode(value)
  } catch {
    return null
  }
}

// Big endian 8 byte encoding of a frame sequence number.
export function seqBytes(seq: number): Uint8Array {
  const out = new Uint8Array(8)
  new DataView(out.buffer).setBigUint64(0, BigInt(seq), false)
  return out
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  let total = 0
  for (const part of parts) total += part.length
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = ""
  for (let i = 0; i < bytes.length; i += 1) hex += bytes[i].toString(16).padStart(2, "0")
  return hex
}
