import { MessageCircle } from "lucide-react"
import { useState } from "react"
import type { ChatMember } from "../../models/chat"
import { ChatInbox } from "./ChatInbox"
import { ChatThread } from "./ChatThread"
export function ChatPage() {
 const [active,setActive]=useState<ChatMember|null>(null)
 return <div className={`mx-auto ${active?"h-[100dvh]":"h-[calc(100dvh-72px)]"} max-w-[1360px] sm:px-5 sm:py-4 lg:h-[100dvh] lg:px-3 lg:py-5 xl:px-6`}><div className="chat-frame flex h-full overflow-hidden lg:rounded-[26px]">
  <aside className={`w-full shrink-0 overflow-hidden min-h-0 lg:block lg:w-[360px] lg:border-r lg:border-line/50 xl:w-[400px] ${active?"hidden":"block"}`}><ChatInbox activeChatId={active?.chat.id??null} onSelect={setActive}/></aside>
  <section className={`min-w-0 flex-1 ${active?"block":"hidden lg:block"}`}>{active?<ChatThread chat={active.chat} onBack={()=>setActive(null)}/>:<div className="hidden h-full items-center justify-center lg:flex"><div className="max-w-sm text-center"><span className="glass-key mx-auto grid h-20 w-20 place-items-center rounded-[24px] text-accent"><MessageCircle className="h-8 w-8"/></span><h2 className="mt-5 text-[24px] font-extrabold tracking-ios text-ink">Your conversations</h2><p className="mt-2 text-[14px] leading-relaxed text-muted">Text, groups and live voice in one calm, encrypted space.</p></div></div>}</section>
 </div></div>
}
