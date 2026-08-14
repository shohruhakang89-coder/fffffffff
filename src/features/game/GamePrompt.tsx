import { useRef, useState } from "react";
import { KeyraButton } from "../../ui/KeyraButton";

interface Props {
  prompt: string;
  solved: number;
  total: number;
  attempts: number;
  onSubmit: (value: string) => Promise<boolean | null>;
}

// The frosted-glass hero: current problem, a large answer field, and gentle
// wrong-answer feedback. Correct answers advance instantly via the parent.
export function GamePrompt({
  prompt,
  solved,
  total,
  attempts,
  onSubmit,
}: Props) {
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    const v = value.trim();
    if (v === "" || busy) return;
    setBusy(true);
    const ok = await onSubmit(v);
    setBusy(false);
    setWrong(ok === false);
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="glass-frost p-7 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">
        Problem {solved + 1} of {total}
      </p>
      <p className="font-mono-keyra mt-3 text-4xl font-bold text-[color:var(--keyra-text)]">
        {prompt}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mx-auto mt-6 flex max-w-xs flex-col gap-3"
      >
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="text"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="Answer"
          className="rounded-2xl border border-line bg-surface px-4 py-3 text-center text-2xl font-semibold text-[color:var(--keyra-text)] outline-none focus:border-accent"
        />
        <KeyraButton label="Submit" type="submit" loading={busy} />
      </form>
      {wrong && (
        <p className="mt-3 text-[13px] font-semibold text-danger">
          Not quite - try again ({attempts} tries)
        </p>
      )}
    </div>
  );
}
