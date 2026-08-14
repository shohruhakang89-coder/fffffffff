import type { Json } from "../lib/net/rpcEnvelope"
import { userFromJson, type KeyraUser } from "../models/user"
import { rpc, sessions } from "../store/client"
import { useAccountsStore } from "../store/accountsStore"

function sessionOf(data: Json): Json {
  const session = data["session"]
  return typeof session === "object" && session !== null ? (session as Json) : {}
}

function persist(data: Json): KeyraUser {
  const raw = typeof data["user"] === "object" && data["user"] !== null ? (data["user"] as Json) : {}
  const user = userFromJson(raw)
  sessions.save(sessionOf(data), user.username)
  useAccountsStore.getState().remember(user)
  return user
}

export async function register(input: {
  username: string
  password: string
  displayName?: string
  locale?: string
}): Promise<KeyraUser> {
  const params: Json = {
    username: input.username,
    password: input.password,
    locale: input.locale ?? "en",
  }
  if (input.displayName && input.displayName.length > 0) params["display_name"] = input.displayName
  return persist(await rpc.call("auth.register", params))
}

export async function login(username: string, password: string): Promise<KeyraUser> {
  return persist(await rpc.call("auth.login", { username, password }))
}

export async function me(): Promise<KeyraUser> {
  return userFromJson(await rpc.call("me.get"))
}

export async function updateProfile(patch: {
  displayName?: string
  username?: string
  locale?: string
  country?: string
  keyboard?: string
}): Promise<KeyraUser> {
  const params: Json = {}
  if (patch.displayName !== undefined) params["display_name"] = patch.displayName
  if (patch.username !== undefined) params["username"] = patch.username
  if (patch.locale !== undefined) params["locale"] = patch.locale
  if (patch.country !== undefined) params["country"] = patch.country
  if (patch.keyboard !== undefined) params["keyboard"] = patch.keyboard
  return userFromJson(await rpc.call("me.update", params))
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await rpc.call("me.password", { current_password: currentPassword, new_password: newPassword })
  sessions.clear()
}

export async function rotate(): Promise<void> {
  sessions.save(await rpc.call("auth.rotate"))
}

export async function devices(): Promise<Json[]> {
  const data = await rpc.call("sessions.list")
  const items = data["sessions"] ?? data["items"]
  if (!Array.isArray(items)) return []
  return items.filter((it): it is Json => typeof it === "object" && it !== null)
}

export async function revokeDevice(sessionId: number): Promise<void> {
  await rpc.call("sessions.revoke", { session_id: sessionId })
}

export async function revokeOtherDevices(): Promise<void> {
  await rpc.call("sessions.revoke_others")
}

export async function logout(): Promise<void> {
  try {
    await rpc.call("auth.logout")
  } catch {
    // Signing out locally must work even with no connection.
  } finally {
    sessions.clear()
  }
}
