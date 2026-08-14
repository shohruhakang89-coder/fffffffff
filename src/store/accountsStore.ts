import { create } from "zustand"
import {
  loadAccounts,
  saveAccounts,
  type StoredAccount,
} from "../lib/storage/accountsStorage"
import { sessions } from "./client"
import type { KeyraUser } from "../models/user"

interface AccountsStore {
  list: StoredAccount[]
  activeUserId: number
  hydrate: () => void
  remember: (user: KeyraUser) => void
  switchTo: (userId: number) => void
  addAccount: () => void
  removeAccount: (userId: number) => void
  forgetActive: () => void
}

// A page reload is the simplest, safest way to rebind the encrypted socket to a
// different session token, so every switch persists first and then reloads.
export const useAccountsStore = create<AccountsStore>((set, get) => ({
  list: [],
  activeUserId: 0,

  hydrate: () => {
    const list = loadAccounts()
    const active = list.find((a) => a.token === sessions.token)
    set({ list, activeUserId: active ? active.userId : 0 })
  },

  remember: (user) => {
    const token = sessions.token ?? ""
    if (user.id <= 0 || token.length === 0) return
    const entry: StoredAccount = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      token,
      sessionId: sessions.sessionId,
      expiresAt: sessions.expiresAt,
    }
    const list = [entry, ...get().list.filter((a) => a.userId !== user.id)]
    saveAccounts(list)
    set({ list, activeUserId: user.id })
  },

  switchTo: (userId) => {
    const acc = get().list.find((a) => a.userId === userId)
    if (!acc || acc.userId === get().activeUserId) return
    sessions.save(
      { session_token: acc.token, session_id: acc.sessionId, expires_at: acc.expiresAt },
      acc.username,
    )
    window.location.reload()
  },

  addAccount: () => {
    // Keep the roster, drop only the active slot, and land on the login screen.
    sessions.clear()
    window.location.reload()
  },

  removeAccount: (userId) => {
    const list = get().list.filter((a) => a.userId !== userId)
    saveAccounts(list)
    set({ list })
  },

  forgetActive: () => {
    const list = get().list.filter((a) => a.userId !== get().activeUserId)
    saveAccounts(list)
    set({ list, activeUserId: 0 })
  },
}))
