import { create } from "zustand"

// Lets a full-screen mobile view (e.g. an open chat thread) hide the HomeShell
// bottom navigation so it can use the entire viewport. Desktop is unaffected —
// the dock there is already shown separately.
interface UiState {
  mobileNavHidden: boolean
  setMobileNavHidden: (hidden: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavHidden: false,
  setMobileNavHidden: (hidden) => set({ mobileNavHidden: hidden }),
}))
