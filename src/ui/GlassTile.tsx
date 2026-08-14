import type { CSSProperties, ReactNode } from "react";

/**
 * Signature frosted-glass icon tile -- the dimensional "app glass" look from the
 * iOS reference designs. Structure/sheen/shadow live in `.glass-tile`
 * (theme.css); each instance only feeds the accent (--tile-tint) and size, so
 * the icon (currentColor) picks up the tint automatically.
 */
export function GlassTile({
  children,
  tint,
  size = 46,
  radius = 16,
  className = "",
}: {
  children: ReactNode;
  tint: string;
  size?: number;
  radius?: number;
  className?: string;
}) {
  const style = {
    "--tile-tint": tint,
    width: size,
    height: size,
    borderRadius: radius,
  } as unknown as CSSProperties;
  return (
    <span className={`glass-tile ${className}`.trim()} style={style}>
      <span className="relative z-[1] grid place-items-center">{children}</span>
    </span>
  );
}
