import type { ReactNode } from "react"
import {
  BookOpen,
  Calculator,
  Code2,
  Database,
  Gamepad2,
  GraduationCap,
  Keyboard,
  Mic,
  PenLine,
  Sigma,
  Terminal,
} from "lucide-react"

// Maps the icon string stored on a category to a lucide glyph.
const MAP: Record<string, (cls: string) => ReactNode> = {
  book: (c) => <BookOpen className={c} />,
  code: (c) => <Code2 className={c} />,
  sigma: (c) => <Sigma className={c} />,
  function: (c) => <Sigma className={c} />,
  calculator: (c) => <Calculator className={c} />,
  graduation: (c) => <GraduationCap className={c} />,
  keyboard: (c) => <Keyboard className={c} />,
  terminal: (c) => <Terminal className={c} />,
  database: (c) => <Database className={c} />,
  mic: (c) => <Mic className={c} />,
  edit: (c) => <PenLine className={c} />,
}

export function catalogIcon(name: string, className = "h-[18px] w-[18px]"): ReactNode {
  const make = MAP[name] ?? ((c: string) => <Gamepad2 className={c} />)
  return make(className)
}
