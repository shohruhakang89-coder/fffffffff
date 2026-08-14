import { create } from "zustand"
import * as authApi from "../api/authApi"
import { demoUser, isDemo } from "../config/demo"
import { ApiError } from "../lib/net/apiError"
import type { KeyraUser } from "../models/user"
import { sessions } from "./client"

export type AuthStatus = "unknown" | "authenticated" | "unauthenticated"

interface AuthStore {
  status: AuthStatus
  user: KeyraUser | null
  busy: boolean
  error: string | null
  restore: () => Promise<void>
  login: (username: string, password: string) => Promise<boolean>
  register: (input: {
    username: string
    password: string
    displayName?: string
    locale?: string
  }) => Promise<boolean>
  refreshProfile: () => Promise<void>
  updateLocalProfile: (user: KeyraUser) => void
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set) => {
  const run = async (action: () => Promise<KeyraUser>): Promise<boolean> => {
    set({ busy: true, error: null })
    try {
      const user = await action()
      set({ status: "authenticated", user, busy: false })
      return true
    } catch (error) {
      set({
        busy: false,
        error: error instanceof ApiError ? error.message : "Unexpected error",
      })
      return false
    }
  }

  return {
    status: "unknown",
    user: null,
    busy: false,
    error: null,
    restore: async () => {
      if (isDemo()) {
        set({ status: "authenticated", user: demoUser(), error: null })
        return
      }
      if (!sessions.hasSession) {
        set({ status: "unauthenticated", user: null })
        return
      }
      try {
        set({ status: "authenticated", user: await authApi.me() })
      } catch (error) {
        if (error instanceof ApiError && error.isUnauthorized) {
          await authApi.logout()
        }
        set({
          status: "unauthenticated",
          user: null,
          error: error instanceof ApiError ? error.message : null,
        })
      }
    },
    login: (username, password) => run(() => authApi.login(username, password)),
    register: (input) => run(() => authApi.register(input)),
    refreshProfile: async () => {
      try {
        set({ user: isDemo() ? demoUser() : await authApi.me() })
      } catch (error) {
        if (error instanceof ApiError) set({ error: error.message })
      }
    },
    updateLocalProfile: (user) => set({ user }),
    logout: async () => {
      set({ busy: true, error: null })
      await authApi.logout()
      set({ status: "unauthenticated", user: null, busy: false })
    },
    clearError: () => set({ error: null }),
  }
})
