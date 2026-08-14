import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ShieldOff } from "lucide-react"
import * as authApi from "../../api/authApi"
import { ApiError } from "../../lib/net/apiError"
import type { Json } from "../../lib/net/rpcEnvelope"
import { Routes } from "../../app/routes"
import { GlassCard } from "../../ui/GlassCard"
import { KeyraBackground } from "../../ui/KeyraBackground"
import { KeyraButton } from "../../ui/KeyraButton"
import { DeviceTile } from "./DeviceTile"

export function DevicesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Json[]>([])
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setPhase("loading"); setError(null)
    try {
      setItems(await authApi.devices()); setPhase("ready")
    } catch (err) {
      setPhase("error"); setError(err instanceof ApiError ? err.message : "Could not load devices.")
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const revoke = async (id: number) => {
    setBusy(true)
    try { await authApi.revokeDevice(id); await load() } finally { setBusy(false) }
  }
  const revokeOthers = async () => {
    setBusy(true)
    try { await authApi.revokeOtherDevices(); await load() } finally { setBusy(false) }
  }

  return (
    <KeyraBackground>
      <div className="mx-auto max-w-2xl p-6">
        <button
          onClick={() => navigate(Routes.profile)}
          className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-[color:var(--keyra-text)]"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        <h1 className="text-xl font-extrabold">Devices &amp; sessions</h1>
        <p className="mt-1 text-[13px] text-muted">
          Every signed-in device holds its own encrypted session. Revoke any you do not recognise.
        </p>

        {phase === "loading" && <p className="mt-6 text-sm text-muted">Loading...</p>}
        {phase === "error" && (
          <GlassCard className="mt-6">
            <p className="text-sm text-danger">{error}</p>
          </GlassCard>
        )}
        {phase === "ready" && (
          <>
            <div className="mt-6 flex flex-col gap-3">
              {items.length === 0 && <p className="text-sm text-muted">No active sessions.</p>}
              {items.map((item, index) => (
                <DeviceTile
                  key={`${item["session_id"] ?? item["id"] ?? index}`}
                  data={item}
                  disabled={busy}
                  onRevoke={revoke}
                />
              ))}
            </div>
            {items.length > 1 && (
              <div className="mt-5">
                <KeyraButton
                  label="Sign out all other devices"
                  kind="ghost"
                  loading={busy}
                  onClick={() => void revokeOthers()}
                  icon={<ShieldOff className="h-[18px] w-[18px]" />}
                />
              </div>
            )}
          </>
        )}
      </div>
    </KeyraBackground>
  )
}
