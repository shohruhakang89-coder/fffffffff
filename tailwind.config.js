/** @type {import('tailwindcss').Config} */
const color = (name) => `rgb(var(--keyra-${name}-rgb) / <alpha-value>)`

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: color("bg"),
        surface: color("surface"),
        surfaceHi: color("surface-hi"),
        surfaceHigh: color("surface-hi"),
        accent: color("accent"),
        accentSoft: color("accent-soft"),
        mint: color("mint"),
        amber: color("amber"),
        danger: color("danger"),
        muted: color("text-muted"),
        line: color("line"),
        textPrimary: color("text"),
        ink: color("text"),
      },
      borderRadius: { xl2: "18px", xl3: "24px", pill: "999px" },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "system-ui", "Inter", "Segoe UI", "sans-serif"],
        mono: ["SF Mono", "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "var(--keyra-shadow-glow)",
        card: "var(--keyra-shadow-card)",
        float: "var(--keyra-shadow-float)",
      },
    },
  },
  plugins: [],
}
