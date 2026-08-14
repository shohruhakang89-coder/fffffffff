import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { AtSign, BadgeCheck, Lock, Rocket } from "lucide-react"
import { KeyraButton } from "../../ui/KeyraButton"
import { KeyraField } from "../../ui/KeyraField"
import { useAuthStore } from "../../store/authStore"
import { Routes } from "../../app/routes"
import { AuthScaffold } from "./AuthScaffold"
import { ErrorBanner } from "./ErrorBanner"

const LOCALES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Russian" },
  { code: "uz", label: "Uzbek" },
  { code: "es", label: "Spanish" },
  { code: "tr", label: "Turkish" },
]

function usernameError(name: string): string | null {
  const value = name.trim()
  if (value.length < 3 || value.length > 20) return "3 to 20 characters"
  if (!/^[A-Za-z0-9_]+$/.test(value)) return "Letters, digits and _ only"
  return null
}

function passwordError(pw: string): string | null {
  if (pw.length < 8) return "At least 8 characters"
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Mix letters and digits"
  return null
}

export function RegisterPage() {
  const [username, setUsername] = useState("")
  const [display, setDisplay] = useState("")
  const [password, setPassword] = useState("")
  const [locale, setLocale] = useState("en")
  const [touched, setTouched] = useState(false)
  const busy = useAuthStore((store) => store.busy)
  const error = useAuthStore((store) => store.error)
  const register = useAuthStore((store) => store.register)

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    setTouched(true)
    if (usernameError(username) || passwordError(password)) return
    void register({ username: username.trim(), password, displayName: display.trim(), locale })
  }

  return (
    <AuthScaffold
      title="Create your account"
      subtitle="Practice, race friends and climb the global leaderboard."
      footer={
        <Link to={Routes.login} className="text-sm text-accentSoft hover:underline">
          Already registered? Sign in
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
          error={touched ? usernameError(username) : null}
        />
        <KeyraField
          label="Display name (optional)"
          value={display}
          onChange={setDisplay}
          hint="Dilshod"
          icon={<BadgeCheck className="h-5 w-5" />}
        />
        <KeyraField
          label="Password"
          value={password}
          onChange={setPassword}
          hint="at least 8 characters"
          type="password"
          icon={<Lock className="h-5 w-5" />}
          error={touched ? passwordError(password) : null}
          onSubmitEnter={() => submit()}
        />
        <label className="block">
          <span className="mb-2 ml-1 block text-[13px] font-semibold text-muted">Language</span>
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
            className="w-full rounded-2xl border border-line bg-surfaceHi px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {LOCALES.map((item) => (
              <option key={item.code} value={item.code} className="bg-surface">
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <KeyraButton label="Create account" type="submit" loading={busy} icon={<Rocket className="h-[18px] w-[18px]" />} />
      </form>
    </AuthScaffold>
  )
}
