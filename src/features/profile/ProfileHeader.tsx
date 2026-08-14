import { Gauge, Sparkles, Zap } from "lucide-react"
import type { ReactNode } from "react"
import { levelProgress,userInitials,xpToNextLevel,type KeyraUser } from "../../models/user"
import { TierBadge } from "./TierBadge"
export function ProfileHeader({user}:{user:KeyraUser}) {
 const progress=Math.round(levelProgress(user)*100)
 return <section className="profile-hero liquid-card p-5 sm:p-7">
  <span className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-accent/10 blur-3xl"/>
  <div className="relative flex items-center gap-5"><Avatar user={user}/><div className="min-w-0 flex-1"><span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[.15em] text-accent"><Sparkles className="h-3 w-3"/> Keyra hisobi</span><h2 className="mt-1 truncate text-[24px] font-extrabold tracking-ios text-ink sm:text-[32px]">{user.displayName}</h2><p className="truncate text-[12px] text-muted">@{user.username}</p><div className="mt-2"><TierBadge tier={user.tier} rating={user.rating}/></div></div></div>
  <div className="relative mt-6 grid grid-cols-3 gap-2.5"><Stat icon={<Gauge/>} value={user.rating.toLocaleString()} label="Reyting"/><Stat value={String(user.level)} label="Daraja"/><Stat icon={<Zap/>} value={user.xp.toLocaleString()} label="XP"/></div>
  <div className="relative mt-4 rounded-[18px] border border-line/60 bg-surface/70 p-4"><div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-muted"><span>{user.level}-daraja jarayoni</span><span>{xpToNextLevel(user)} XP qoldi</span></div><div className="h-2 overflow-hidden rounded-full bg-line/70"><div className="skill-line h-full rounded-full transition-all duration-700" style={{width:`${progress}%`}}/></div></div>
 </section>
}
function Avatar({user}:{user:KeyraUser}) { if(user.avatarUrl)return <img src={user.avatarUrl} alt={user.displayName} className="h-24 w-24 rounded-[28px] object-cover shadow-float"/>;return <div className="glass-key grid h-24 w-24 shrink-0 place-items-center rounded-[28px] text-[32px] font-extrabold text-accent sm:h-28 sm:w-28">{userInitials(user)}</div> }
function Stat({icon,value,label}:{icon?:ReactNode;value:string;label:string}) { return <div className="rounded-[16px] border border-line/50 bg-surface/75 p-3 text-center">{icon&&<span className="mx-auto mb-1 grid h-5 w-5 place-items-center text-accent [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>}<p className="truncate text-[16px] font-extrabold tracking-ios text-ink">{value}</p><p className="text-[9px] font-semibold text-muted">{label}</p></div> }
