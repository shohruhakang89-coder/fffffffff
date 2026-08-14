import type { ReactElement } from "react"
import { Navigate, Route, Routes as RouterRoutes } from "react-router-dom"
import { LoginPage } from "../features/auth/LoginPage"
import { RegisterPage } from "../features/auth/RegisterPage"
import { HomeShell } from "../features/home/HomeShell"
import { PracticePage } from "../features/practice/PracticePage"
import { RoomLobbyPage } from "../features/rooms/RoomLobbyPage"
import { DevicesPage } from "../features/profile/DevicesPage"
import { ProfilePage } from "../features/profile/ProfilePage"
import { useAuthStore } from "../store/authStore"
import { Routes } from "./routes"

// Auth guard, mirroring the Flutter router redirect: signed-in users are kept
// out of the auth pages, signed-out users are bounced to login.
export function AppRoutes() {
  const signedIn = useAuthStore((store) => store.status === "authenticated")
  const guard = (node: ReactElement): ReactElement =>
    signedIn ? node : <Navigate to={Routes.login} replace />
  const authOnly = (node: ReactElement): ReactElement =>
    signedIn ? <Navigate to={Routes.home} replace /> : node

  return (
    <RouterRoutes>
      <Route path={Routes.login} element={authOnly(<LoginPage />)} />
      <Route path={Routes.register} element={authOnly(<RegisterPage />)} />
      <Route path={Routes.home} element={guard(<HomeShell />)} />
      <Route path={Routes.profile} element={guard(<ProfilePage />)} />
      <Route path={Routes.devices} element={guard(<DevicesPage />)} />
      <Route path={Routes.practice} element={guard(<PracticePage />)} />
      <Route path={`${Routes.room}/:code`} element={guard(<RoomLobbyPage />)} />
      <Route path="*" element={<Navigate to={signedIn ? Routes.home : Routes.login} replace />} />
    </RouterRoutes>
  )
}
