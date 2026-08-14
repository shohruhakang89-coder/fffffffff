import { Search } from "lucide-react"
import { useState } from "react"
import { chatApi } from "../../api/chatApi"
import type { Chat } from "../../models/chat"
import { LiquidSearchBar } from "../../ui/LiquidSearchBar"

export function DiscoverPanel({ busy, onJoin }: { busy: boolean; onJoin: (chat: Chat) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Chat[]>([])
  const [searching, setSearching] = useState(false)
  const search = async () => {
    setSearching(true)
    try { setResults(await chatApi.search(query.trim())) }
    finally { setSearching(false) }
  }
  return (
    <div>
      <form onSubmit={(event) => { event.preventDefault(); void search() }}>
        <LiquidSearchBar
          query={query}
          onQuery={setQuery}
          placeholder="Find groups and channels"
          icon={<Search className="h-3.5 w-3.5 text-muted" />}
          trailing={<button type="submit" disabled={searching} className="rounded-[10px] bg-accent px-3 py-1.5 text-[10px] font-semibold text-white disabled:opacity-50">Search</button>}
          size="sm"
        />
      </form>
      <ul className="scroll-clean mt-2.5 max-h-64 space-y-1.5 overflow-y-auto">
        {results.length === 0 ? <li className="rounded-[14px] bg-surfaceHi/70 py-6 text-center text-[10px] text-muted">{searching ? "Searching..." : "Search public Keyra spaces."}</li> : results.map((chat) => (
          <li key={chat.id} className="flex items-center gap-3 rounded-[14px] bg-surface/60 p-2.5">
            <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold text-ink">{chat.title || chat.username || "Chat"}</span><span className="block truncate text-[9px] text-muted">@{chat.username} - {chat.member_count_cached} members</span></span>
            <button onClick={() => onJoin(chat)} disabled={busy} className="rounded-[10px] bg-surfaceHi px-3 py-1.5 text-[10px] font-semibold text-accent disabled:opacity-50">Join</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
