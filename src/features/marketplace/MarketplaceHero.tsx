import { ArrowRight, Radio, Sparkles, UsersRound } from "lucide-react"
export function MarketplaceHero({liveCount,onExplore}:{liveCount:number;onExplore:()=>void}) {
 return <section className="market-hero relative min-h-[188px] overflow-hidden rounded-[22px] p-5 sm:min-h-[270px] sm:p-8 lg:min-h-[310px] lg:p-10">
  <span className="hero-orbit pointer-events-none absolute right-[7%] top-[18%] h-36 w-36 rounded-full border border-accent/15 sm:h-56 sm:w-56"/>
  <div className="relative z-10 max-w-[68%] sm:max-w-[58%]">
   <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line/60 bg-surface/80 px-3 text-[10px] font-bold text-muted"><Radio className="h-3 w-3 text-mint"/> {liveCount} live now</span>
   <h2 className="mt-3 max-w-xl text-[30px] font-extrabold leading-[.96] tracking-[-.05em] text-ink sm:mt-5 sm:text-[48px] lg:text-[56px]">Learn deeply.<br/><span className="text-gradient">Win together.</span></h2>
   <p className="mt-3 hidden max-w-md text-[14px] leading-relaxed text-muted sm:block">Educational games for solo focus, fast duels and live parties with friends.</p>
   <button onClick={onExplore} className="pressable mt-3 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-accent px-4 text-[12px] font-extrabold text-white shadow-glow sm:mt-5">Explore games <ArrowRight className="h-4 w-4"/></button>
  </div>
  <img src="/assets/keyra-knowledge-glass.png" alt="" className="hero-art pointer-events-none absolute -bottom-5 -right-12 z-[1] w-[64%] max-w-[520px] sm:-bottom-12 sm:-right-5 sm:w-[52%] lg:right-4"/>
  <span className="absolute right-5 top-5 z-10 hidden items-center gap-1.5 rounded-full bg-surface/65 px-3 py-2 text-[10px] font-semibold text-muted sm:flex"><UsersRound className="h-3.5 w-3.5"/> Up to 32 players</span>
  <span className="absolute bottom-6 right-[42%] hidden text-accent/45 lg:block"><Sparkles className="h-5 w-5"/></span>
 </section>
}
