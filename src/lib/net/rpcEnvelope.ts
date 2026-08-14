import { ApiError, statusForRpcCode } from "./apiError"

export type Json = Record<string, unknown>

export interface RpcRequest extends Json {
  id: number
  m: string
  p: Json
}

// One outstanding request waiting for its answer.
export class PendingCall {
  readonly promise: Promise<Json>
  private resolveFn!: (data: Json) => void
  private rejectFn!: (error: unknown) => void
  private settled = false

  constructor(
    readonly id: number,
    readonly method: string,
    readonly params: Json,
  ) {
    this.promise = new Promise<Json>((resolve, reject) => {
      this.resolveFn = resolve
      this.rejectFn = reject
    })
  }

  get envelope(): RpcRequest {
    return { id: this.id, m: this.method, p: this.params }
  }

  complete(data: Json): void {
    if (this.settled) return
    this.settled = true
    this.resolveFn(data)
  }

  fail(error: unknown): void {
    if (this.settled) return
    this.settled = true
    this.rejectFn(error)
  }
}

// Parses one plaintext control message; returns null for anything unexpected.
export function decodeSocketJson(raw: unknown): Json | null {
  if (typeof raw !== "string" || raw.length === 0) return null
  try {
    const value = JSON.parse(raw) as unknown
    return typeof value === "object" && value !== null ? (value as Json) : null
  } catch {
    return null
  }
}

// Turns { ok:false, error:{code,message} } into the app's ApiError.
export function rpcError(response: Json): ApiError {
  const error = response["error"]
  if (typeof error === "object" && error !== null) {
    const map = error as Json
    const code = typeof map["code"] === "string" ? (map["code"] as string) : "rpc_error"
    const message =
      typeof map["message"] === "string" ? (map["message"] as string) : "Request failed."
    return new ApiError(code, message, statusForRpcCode(code))
  }
  return new ApiError("rpc_error", "Request failed.", 400)
}
