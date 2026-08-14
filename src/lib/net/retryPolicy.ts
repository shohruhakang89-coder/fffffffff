// Exponential backoff for reconnects: 0.5s, 1s, 2s ... capped at 30s.
export class RetryPolicy {
  private step = 0

  constructor(
    private baseMs = 500,
    private maxSteps = 6,
  ) {}

  next(): number {
    this.step = this.step >= this.maxSteps ? this.maxSteps : this.step + 1
    const ms = this.baseMs * (1 << (this.step - 1))
    return ms > 30000 ? 30000 : ms
  }

  reset(): void {
    this.step = 0
  }
}
