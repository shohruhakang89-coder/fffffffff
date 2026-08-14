export type CharState = "correct" | "wrong" | "current" | "pending"

// Pure typing state machine, framework-free and unit-testable. It is fed the
// full input string on every change and recomputes counters from the diff, so
// it works for both hardware and on-screen keyboards. Mirrors the Dart engine.
export class TypingEngine {
  private target: number[]
  private typed: number[] = []
  private correct = 0
  private mistakesCount = 0

  constructor(public readonly text: string) {
    this.target = Array.from(text, (ch) => ch.codePointAt(0) ?? 0)
  }

  get length(): number {
    return this.target.length
  }
  get cursor(): number {
    return this.typed.length
  }
  get correctKeys(): number {
    return this.correct
  }
  get mistakes(): number {
    return this.mistakesCount
  }
  get charsTyped(): number {
    return this.typed.length
  }
  get isComplete(): boolean {
    return this.target.length > 0 && this.typed.length >= this.target.length
  }
  get progress(): number {
    return this.target.length === 0 ? 0 : this.typed.length / this.target.length
  }

  get accuracy(): number {
    const total = this.correct + this.mistakesCount
    return total === 0 ? 100 : (this.correct / total) * 100
  }

  wpm(elapsedMs: number): number {
    const minutes = elapsedMs / 60000
    if (minutes <= 0) return 0
    return this.correct / 5 / minutes
  }

  // Applies the latest input string, counting only the newly added keys.
  update(raw: string): void {
    let next = Array.from(raw, (ch) => ch.codePointAt(0) ?? 0)
    if (next.length > this.target.length) next = next.slice(0, this.target.length)
    let common = 0
    const shorter = Math.min(next.length, this.typed.length)
    while (common < shorter && next[common] === this.typed[common]) common += 1
    for (let idx = common; idx < next.length; idx += 1) {
      if (idx < this.target.length && next[idx] === this.target[idx]) this.correct += 1
      else this.mistakesCount += 1
    }
    this.typed = next
  }

  reset(): void {
    this.typed = []
    this.correct = 0
    this.mistakesCount = 0
  }

  stateAt(index: number): CharState {
    if (index < this.typed.length) {
      return this.typed[index] === this.target[index] ? "correct" : "wrong"
    }
    if (index === this.typed.length) return "current"
    return "pending"
  }

  charAt(index: number): string {
    return String.fromCodePoint(this.target[index])
  }
}
