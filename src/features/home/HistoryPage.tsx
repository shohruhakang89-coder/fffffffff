import { Clock3,Gamepad2,Loader2,Trophy,Zap } from "lucide-react"
import { useEffect,useMemo,useState,type ReactNode } from "react"
import * as api from "../../api/marketplaceApi"
import { isDemo } from "../../config/demo"
import type { GameActivity } from "../../models/marketplace"
import { useAuthStore } from "../../store/authStore"
import { useMarketplaceStore } from "../../store/marketplaceStore"
import { ActivityCard } from "./ActivityCard"
const DAYS=["M","T","W","T","F","S","S"]
export function HistoryPage() {
 const locale=useAuthStore(s=>s.user?.locale??"en"),{games,load}=useMarketplaceStore(),[items,setItems]=useState<GameActivity[]>([]),[loading,setLoading]=useState(true)
 useEffect(()=>{void load();api.history(50).then(setItems).catch(()=>setItems([])).finally(()=>setLoading(false))},[load])
 const m=useMemo(()=>({played:items.length,wins:items.filter(x=>x.outcome==="won").length,xp:items.reduce((a,x)=>a+x.xpGained,0),minutes:Math.round(items.reduce((a,x)=>a+x.durationMs,0)/60000)}),[items])
 const bars=useMemo(()=>{const now=new Date();return Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(now.getDate()-(6-i));return items.filter(x=>x.createdAt&&new Date(x.createdAt).toDateString()===d.toDateString()).reduce((a,x)=>a+x.durationMs,0)})},[items]),high=Math.max(...bars,1)
 return <div className="mx-auto max-w-[1360px] px-4 pb-24 pt-5 sm:px-7 sm:pt-8 lg:px-3 lg:pb-8 xl:px-6">
  <header className="mb-8 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">All games</p><h1 className="text-[32px] font-extrabold tracking-ios text-ink sm:text-[44px]">Game history</h1><p className="mt-1 text-[12px] text-muted sm:text-[14px]">Progress across every useful challenge.</p></div>{isDemo()&&<span className="rounded-full border border-line bg-surface px-3 py-2 text-[10px] font-bold text-muted">Demo data</span>}</header>
  <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
   <section className="liquid-card p-5 sm:p-7"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-accent">Momentum</p><h2 className="text-[22px] font-extrabold tracking-ios text-ink">Last 7 days</h2></div><p className="text-[28px] font-extrabold tracking-ios text-ink">{m.minutes}<span className="ml-1 text-[11px] text-muted">min</span></p></div><div className="mt-8 flex h-44 items-end gap-3">{bars.map((v,i)=><div key={i} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="relative flex-1 overflow-hidden rounded-full bg-line/60"><div className="absolute inset-x-0 bottom-0 min-h-1 rounded-full bg-accent shadow-glow transition-all duration-500" style={{height:`${Math.max(6,v/high*100)}%`,opacity:.5+i*.07}}/></div><span className="text-center text-[9px] font-bold text-muted">{DAYS[i]}</span></div>)}</div></section>
   <section className="grid grid-cols-2 gap-3"><Metric icon={<Gamepad2/>} label="Games played" value={String(m.played)}/><Metric icon={<Trophy/>} label="Wins" value={String(m.wins)}/><Metric icon={<Zap/>} label="XP earned" value={m.xp.toLocaleString()}/><Metric icon={<Clock3/>} label="Play time" value={`${m.minutes}m`}/></section>
  </div>
  <section className="liquid-card mt-5 p-5 sm:p-7"><div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted">Timeline</p><h2 className="text-[22px] font-extrabold tracking-ios text-ink">Recent games</h2></div><span className="text-[10px] text-muted">{items.length} sessions</span></div>{loading?<div className="grid place-items-center py-12 text-muted"><Loader2 className="h-5 w-5 animate-spin"/></div>:items.length?<div className="grid gap-3 lg:grid-cols-2">{items.map(item=><ActivityCard key={item.id} activity={item} game={games.find(g=>g.slug===item.gameSlug)} locale={locale}/>)}</div>:<p className="py-10 text-center text-[12px] text-muted">Completed games will appear here.</p>}</section>
 </div>
}
function Metric({icon,label,value}:{icon:ReactNode;label:string;value:string}) { return <div className="metric-card liquid-card flex min-h-[132px] flex-col justify-between p-4"><span className="grid h-9 w-9 place-items-center rounded-[12px] bg-accent/10 text-accent [&>svg]:h-4 [&>svg]:w-4">{icon}</span><div><p className="text-[24px] font-extrabold tracking-ios">{value}</p><p className="metric-muted text-[10px] font-semibold text-muted">{label}</p></div></div> }
