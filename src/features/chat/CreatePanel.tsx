import { Check, Globe2, Link2, Lock, ShieldCheck } from "lucide-react"
import { useState } from "react"

const FIELD = "liquid-control w-full rounded-[15px] px-3.5 py-3 text-[13px] text-ink outline-none placeholder:text-muted/75"

export function CreatePanel({ busy, onCreate }: { busy: boolean; onCreate: (title: string, username: string, isPublic: boolean) => void }) {
  const [title, setTitle] = useState("")
  const [username, setUsername] = useState("")
  const [about, setAbout] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [step, setStep] = useState<1 | 2>(1)
  const validUsername = /^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(username)
  if (step === 2) return <div className="space-y-3">
    <div className="rounded-[18px] bg-accent/10 p-3.5"><div className="flex items-center gap-2 text-[12px] font-bold text-accent"><ShieldCheck className="h-4 w-4" /> Maxfiylik va manzil</div><p className="mt-1 text-[10px] leading-relaxed text-muted">Keyinroq sozlamalardan ruxsatlar, administratorlar va a’zolarni boshqarishingiz mumkin.</p></div>
    <div className="grid grid-cols-2 gap-2"><button onClick={() => setIsPublic(true)} className={`rounded-[16px] p-3 text-left transition ${isPublic ? "bg-accent text-white shadow-glow" : "bg-surfaceHi text-muted"}`}><Globe2 className="mb-2 h-4 w-4" /><b className="block text-[12px]">Ommaviy</b><span className="text-[9px] opacity-75">Qidiruvda ko‘rinadi</span></button><button onClick={() => setIsPublic(false)} className={`rounded-[16px] p-3 text-left transition ${!isPublic ? "bg-accent text-white shadow-glow" : "bg-surfaceHi text-muted"}`}><Lock className="mb-2 h-4 w-4" /><b className="block text-[12px]">Yopiq</b><span className="text-[9px] opacity-75">Taklif bilan kiriladi</span></button></div>
    {isPublic ? <label className="block text-[10px] font-semibold text-muted">Username<div className="liquid-control mt-1.5 flex items-center rounded-[15px] px-3"><span className="text-accent">@</span><input value={username} onChange={(event) => setUsername(event.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} placeholder="keyra_community" className="min-w-0 flex-1 bg-transparent py-3 text-[13px] outline-none" />{validUsername && <Check className="h-4 w-4 text-mint" />}</div></label> : <div className="liquid-control flex items-center gap-2 rounded-[15px] px-3 py-3 text-[11px] text-muted"><Link2 className="h-4 w-4 text-accent" /> keyra.app/join/havola yaratiladi</div>}
    <div className="flex gap-2"><button onClick={() => setStep(1)} className="pressable flex-1 rounded-[15px] bg-surfaceHi py-3 text-[12px] font-bold text-muted">Orqaga</button><button onClick={() => onCreate(title, username, isPublic)} disabled={busy || (isPublic && !validUsername)} className="pressable flex-[1.5] rounded-[15px] bg-accent py-3 text-[12px] font-bold text-white shadow-glow disabled:opacity-40">{busy ? "Yaratilmoqda..." : "Yaratish"}</button></div>
  </div>
  return <div className="space-y-3"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[10px] font-bold text-white">1</span><span className="text-[11px] font-bold text-ink">Asosiy ma’lumotlar</span><span className="ml-auto text-[10px] text-muted">1 / 2</span></div><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nomi" className={FIELD} /><textarea value={about} onChange={(event) => setAbout(event.target.value)} placeholder="Qisqa tavsif (ixtiyoriy)" rows={3} className={`${FIELD} resize-none`} /><button onClick={() => setStep(2)} disabled={!title.trim()} className="pressable w-full rounded-[15px] bg-accent py-3 text-[12px] font-bold text-white shadow-glow disabled:opacity-40">Davom etish</button></div>
}
