import { Eye,Gamepad2,Play,X } from "lucide-react"
import { useCallback,useEffect,useState } from "react"
import { useNavigate,useParams } from "react-router-dom"
import { roomsApi } from "../../api/roomsApi"
import type { Json } from "../../lib/net/rpcEnvelope"
import { snapshotFromJson,type RoomSnapshot } from "../../models/room"
import { useAuthStore } from "../../store/authStore"
import { rpc } from "../../store/client"
import { GlassCard } from "../../ui/GlassCard"
import { KeyraButton } from "../../ui/KeyraButton"
import { GamePlayPage } from "../game/GamePlayPage"
import { RoomConfigBar } from "./RoomConfigBar"
import { RoomMembers } from "./RoomMembers"
export function RoomLobbyPage(){
 const {code=""}=useParams<{code:string}>(),navigate=useNavigate(),myId=useAuthStore(s=>s.user?.id??0)
 const [snap,setSnap]=useState<RoomSnapshot|null>(null),[loading,setLoading]=useState(true)
 useEffect(()=>{let active=true;roomsApi.state(code).then(s=>active&&setSnap(s)).catch(()=>active&&setSnap(null)).finally(()=>active&&setLoading(false));return()=>{active=false}},[code])
 useEffect(()=>rpc.onEvent((payload:Json)=>{if(payload["event"]!=="room.updated")return;const data=payload["payload"];if(typeof data!=="object"||data===null)return;const next=snapshotFromJson(data as Json);if(next.room.code===code)setSnap(next)}),[code])
 const leave=useCallback(async()=>{try{await roomsApi.leave(code)}catch{}navigate(-1)},[code,navigate])
 if(loading)return <div className="p-8 text-center text-muted">Loading room...</div>
 if(!snap||!snap.room.id)return <div className="p-8 text-center text-muted">This room is no longer available.</div>
 const room=snap.room,isHost=room.hostId===myId,me=snap.members.find(m=>m.userId===myId),observing=me?.role==="observer"
 if(room.status!=="lobby")return <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pb-24 sm:p-6"><button onClick={leave} className="self-start text-[11px] font-bold text-muted">Leave match</button><GamePlayPage code={code} snapshot={snap} myId={myId} onLeave={leave}/></div>
 return <div className="mx-auto max-w-5xl p-4 pb-24 sm:p-6"><header className="mb-4 flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.14em] text-accent">{room.gameSlug.replace(/-/g," ")}</p><h1 className="text-[25px] font-extrabold tracking-ios text-ink">Live lobby</h1></div><button onClick={leave} className="liquid-control flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold text-muted"><X className="h-3.5 w-3.5"/> Leave</button></header><div className="grid gap-3.5 lg:grid-cols-[.82fr_1.18fr]"><div className="space-y-3.5"><GlassCard><p className="text-[9px] font-bold uppercase tracking-wider text-muted">Invite code</p><p className="mt-1 text-[30px] font-extrabold tracking-[.32em] text-ink">{room.code}</p><p className="mt-1 text-[10px] text-muted">{room.playerCount} playing - {room.timeLimitSec/60} min {room.mode} match.</p></GlassCard><RoomConfigBar room={room} isHost={isHost} code={code}/></div><div className="space-y-3.5"><RoomMembers members={snap.members} myId={myId} isHost={isHost} onSetRole={(id,role)=>void roomsApi.setRole(code,role,id)}/><div className="liquid-card space-y-2 p-3.5">{me&&<KeyraButton label={observing?"Join as player":"Switch to observer"} kind="ghost" icon={observing?<Gamepad2 className="h-5 w-5"/>:<Eye className="h-5 w-5"/>} onClick={()=>void roomsApi.setRole(code,observing?"player":"observer")}/>} {isHost&&<KeyraButton label="Start match" icon={<Play className="h-5 w-5"/>} onClick={room.playerCount<1?undefined:()=>void roomsApi.start(code)}/>}</div></div></div></div>
}
