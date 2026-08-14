import { Check,Search } from "lucide-react"
import { useEffect,useState } from "react"
import * as catalogApi from "../../api/catalogApi"
import type { CatalogItem } from "../../models/catalog"
import { LiquidSearchBar } from "../../ui/LiquidSearchBar"
export function ExerciseFinder({gameKind,categoryCode,level,enabled,selected,onSelect}:{gameKind:string;categoryCode:string;level:number;enabled:boolean;selected:CatalogItem|null;onSelect:(v:CatalogItem|null)=>void}){
 const [query,setQuery]=useState(""),[items,setItems]=useState<CatalogItem[]>([]),[loading,setLoading]=useState(false)
 useEffect(()=>{if(!enabled||!categoryCode){setItems([]);return}let active=true;const timer=setTimeout(()=>{setLoading(true);catalogApi.search({q:query,category:categoryCode,gameKind,level,limit:12}).then(v=>active&&setItems(v)).catch(()=>active&&setItems([])).finally(()=>active&&setLoading(false))},220);return()=>{active=false;clearTimeout(timer)}},[query,categoryCode,gameKind,level,enabled])
 if(!enabled)return null
 return <section className="liquid-card p-4 sm:p-5"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-muted">Smart search</p><h2 className="text-[15px] font-extrabold text-ink">Find an exact exercise</h2><LiquidSearchBar query={query} onQuery={setQuery} placeholder={gameKind==="math"?"Search arithmetic, algebra, formula...":"Search drills..."} icon={<Search className="h-3.5 w-3.5 text-muted"/>} className="mt-3" size="sm"/><div className="mt-2 grid max-h-52 gap-1.5 overflow-y-auto">{loading?<p className="py-3 text-center text-[9px] text-muted">Searching...</p>:items.map(item=><button key={`${item.source}-${item.id}`} onClick={()=>onSelect(selected?.id===item.id?null:item)} className={`flex items-center gap-2 rounded-[12px] p-2.5 text-left ${selected?.id===item.id?"bg-accent/10 ring-1 ring-accent/30":"bg-surfaceHi/60"}`}><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-bold text-ink">{item.title}</span><span className="block truncate text-[8px] text-muted">{item.preview}</span></span>{selected?.id===item.id&&<Check className="h-3.5 w-3.5 text-accent"/>}</button>)}</div></section>
}
