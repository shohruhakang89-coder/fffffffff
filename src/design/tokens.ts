export const KeyraColors = {
  bg: "#F3F6FB",
  surface: "#FFFFFF",
  surfaceHi: "#F1F4F9",
  accent: "#007AFF",
  accentSoft: "#DCEEFF",
  mint: "#34C759",
  amber: "#FF9500",
  danger: "#FF3B30",
  text: "#1D1D1F",
  textMuted: "#77839A",
  border: "#DDE5F1",
} as const

export const KeyraSpace = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const
export const KeyraRadius = { sm: 10, md: 14, lg: 20, pill: 999 } as const
export const Tiers = ["bronze", "silver", "gold", "platinum", "diamond", "master"] as const
export type Tier = (typeof Tiers)[number]

export function tierColor(tier: string): string {
  switch (tier) {
    case "silver": return "#7D8798"
    case "gold": return "#B8860B"
    case "platinum": return "#5F7C83"
    case "diamond": return "#007AFF"
    case "master": return "#6E5DA8"
    default: return "#9A6B42"
  }
}
