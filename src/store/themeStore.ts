import { create } from "zustand"

export type ThemeMode = "light" | "dark"
const STORAGE_KEY = "keyra.theme"

function systemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "light"
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === "dark" || saved === "light") return saved
  } catch (_) {}
  return systemTheme()
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#060F1E" : "#F0F3F8")
}

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggle: () => void
}

const initialTheme = readTheme()
applyTheme(initialTheme)

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    try { window.localStorage.setItem(STORAGE_KEY, theme) } catch (_) {}
    applyTheme(theme)
    set({ theme })
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}))
