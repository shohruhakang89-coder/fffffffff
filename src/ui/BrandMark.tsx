// Keyra wordmark: gradient tile plus the name, optional tagline.
export function BrandMark({ size = 28, showTagline = false }: { size?: number; showTagline?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center font-black text-white glow-accent"
          style={{
            height: size * 1.4,
            width: size * 1.4,
            fontSize: size,
            lineHeight: 1,
            borderRadius: size * 0.42,
            backgroundImage: "var(--keyra-accent-gradient)",
          }}
        >
          K
        </div>
        <span className="font-extrabold tracking-tight" style={{ fontSize: size * 1.15 }}>
          Keyra
        </span>
      </div>
      {showTagline && <p className="mt-2 text-[13px] text-muted">Type faster. Think sharper.</p>}
    </div>
  )
}
