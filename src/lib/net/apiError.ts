// Error shape returned by the Keyra API:
// { "ok": false, "error": { "code": "...", "message": "..." } }
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 0,
  ) {
    super(message)
    this.name = "ApiError"
  }

  static network(): ApiError {
    return new ApiError(
      "network_unreachable",
      "Server unreachable. Check your connection.",
      0,
    )
  }

  static timeout(): ApiError {
    return new ApiError("timeout", "The server took too long to answer.", 0)
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429
  }
}

// Maps server error codes onto HTTP-like statuses the UI already understands.
export function statusForRpcCode(code: string): number {
  switch (code) {
    case "unauthorized":
    case "invalid_session":
    case "invalid_credentials":
    case "missing_token":
    case "wrong_password":
      return 401
    case "forbidden":
    case "account_banned":
      return 403
    case "user_not_found":
    case "session_not_found":
      return 404
    case "username_taken":
      return 409
    case "rate_limited":
      return 429
    case "internal_error":
      return 500
    default:
      return 400
  }
}
