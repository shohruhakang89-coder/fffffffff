import { Check, Plus, UserRound, X } from "lucide-react"
import { useEffect } from "react"
import { useAccountsStore } from "../../store/accountsStore"

export function AccountSwitcher() {
  const list = useAccountsStore((store) => store.list)
  const activeUserId = useAccountsStore((store) => store.activeUserId)
  const hydrate = useAccountsStore((store) => store.hydrate)
  const switchTo = useAccountsStore((store) => store.switchTo)
  const addAccount = useAccountsStore((store) => store.addAccount)
  const removeAccount = useAccountsStore((store) => store.removeAccount)
  useEffect(() => hydrate(), [hydrate])
  if (list.length === 0) return null
  return (
    <section className="liquid-card p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-muted">Accounts</p>
      <h2 className="mb-2.5 text-[16px] font-bold tracking-ios text-ink">Switch profile</h2>
      <div className="space-y-1.5">
        {list.map((account) => {
          const active = account.userId === activeUserId
          return (
            <div key={account.userId} className={`flex items-center gap-2.5 rounded-[15px] p-2 ${active ? "bg-surface/80 shadow-sm" : "bg-surfaceHi/60"}`}>
              <span className="glass-key grid h-9 w-9 shrink-0 place-items-center rounded-[12px] text-muted"><UserRound className="h-4 w-4" /></span>
              <button onClick={() => active ? undefined : switchTo(account.userId)} className="min-w-0 flex-1 text-left"><span className="block truncate text-[12px] font-semibold text-ink">{account.displayName}</span><span className="block truncate text-[9px] text-muted">@{account.username}</span></button>
              {active ? <Check className="h-4 w-4 text-accent" /> : <button onClick={() => removeAccount(account.userId)} className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-surface hover:text-danger"><X className="h-3.5 w-3.5" /></button>}
            </div>
          )
        })}
      </div>
      <button onClick={addAccount} className="pressable mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[14px] bg-surfaceHi py-2.5 text-[12px] font-semibold text-accent"><Plus className="h-3.5 w-3.5" /> Add account</button>
    </section>
  )
}
