import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { AtSign, Lock, LogIn } from "lucide-react"
import { KeyraButton } from "../../ui/KeyraButton"
import { KeyraField } from "../../ui/KeyraField"
import { useAuthStore } from "../../store/authStore"
import { Routes } from "../../app/routes"
import { AuthScaffold } from "./AuthScaffold"
import { ErrorBanner } from "./ErrorBanner"

export function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const busy = useAuthStore((store) => store.busy)
  const error = useAuthStore((store) => store.error)
  const login = useAuthStore((store) => store.login)

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (username.trim().length < 3 || password.length < 8) return
    void login(username.trim(), password)
  }

  return (
    <AuthScaffold
      title="Welcome back"
      subtitle="Sign in to keep your streak and rating going."
      footer={
        <Link to={Routes.register} className="text-sm text-accentSoft hover:underline">
          No account yet? Create one
        </Link>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        <KeyraField
          label="Username"
          value={username}
          onChange={setUsername}
          hint="dilshod"
          icon={<AtSign className="h-5 w-5" />}
          autoComplete="username"
        />
        <KeyraField
          label="Password"
          value={password}
          onChange={setPassword}
          hint="********"
          type="password"
          icon={<Lock className="h-5 w-5" />}
          autoComplete="current-password"
          onSubmitEnter={() => submit()}
        />
        <KeyraButton label="Sign in" type="submit" loading={busy} icon={<LogIn className="h-[18px] w-[18px]" />} />
      </form>
    </AuthScaffold>
  )
}
