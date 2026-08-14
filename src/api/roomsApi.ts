import type { Json } from "../lib/net/rpcEnvelope"
import { snapshotFromJson,type RoomSnapshot } from "../models/room"
import { rpc } from "../store/client"
export interface RoomConfigInput { gameSlug:string; kind:string; subjectCode:string; exerciseId:number; level:number; mode:string; maxPlayers:number; timeLimitSec:number; hostPlays:boolean }
const params=(v:RoomConfigInput):Json=>({game_slug:v.gameSlug,kind:v.kind,subject_code:v.subjectCode,exercise_id:v.exerciseId,level:v.level,mode:v.mode,max_players:v.maxPlayers,time_limit_sec:v.timeLimitSec,host_plays:v.hostPlays})
async function snap(method:string,p:Json):Promise<RoomSnapshot>{return snapshotFromJson(await rpc.call(method,p))}
export const roomsApi={
 create:(v:RoomConfigInput)=>snap("rooms.create",params(v)),join:(code:string)=>snap("rooms.join",{code}),
 leave:(code:string)=>snap("rooms.leave",{code}),state:(code:string)=>snap("rooms.state",{code}),
 config:(code:string,v:RoomConfigInput)=>snap("rooms.config",{code,...params(v)}),
 setRole:(code:string,role:string,userId?:number)=>snap("rooms.setRole",userId?{code,role,user_id:userId}:{code,role}),
 start:(code:string)=>snap("rooms.start",{code}),
}
