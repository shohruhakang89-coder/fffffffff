export interface RoomMember { userId:number; username:string; displayName:string; avatarUrl:string; role:string; ready:boolean; isHost:boolean }
export interface RoomInfo {
 id:number; code:string; hostId:number; gameSlug:string; kind:string; subjectCode:string
 exerciseId:number; level:number; mode:string; maxPlayers:number; timeLimitSec:number
 hostPlays:boolean; status:string; playerCount:number
}
export interface RoomSnapshot { room:RoomInfo; members:RoomMember[] }
type J=Record<string,unknown>
const n=(v:unknown,f=0)=>typeof v==="number"&&Number.isFinite(v)?Math.trunc(v):f
const s=(v:unknown,f="")=>typeof v==="string"?v:f
const b=(v:unknown)=>v===true
function member(j:J):RoomMember { return {userId:n(j["user_id"]),username:s(j["username"]),displayName:s(j["display_name"]),avatarUrl:s(j["avatar_url"]),role:s(j["role"],"player"),ready:b(j["ready"]),isHost:b(j["is_host"])} }
function room(j:J):RoomInfo { return {id:n(j["id"]),code:s(j["code"]),hostId:n(j["host_id"]),gameSlug:s(j["game_slug"],"math-rush"),kind:s(j["kind"],"math"),subjectCode:s(j["subject_code"]),exerciseId:n(j["exercise_id"]),level:n(j["level"],2),mode:s(j["mode"],"duo"),maxPlayers:n(j["max_players"],2),timeLimitSec:n(j["time_limit_sec"],120),hostPlays:b(j["host_plays"]),status:s(j["status"],"lobby"),playerCount:n(j["player_count"])} }
export function snapshotFromJson(data:J):RoomSnapshot {
 const r=data["room"],m=data["members"]
 return {room:room(typeof r==="object"&&r!==null?r as J:{}),members:Array.isArray(m)?m.filter((x):x is J=>typeof x==="object"&&x!==null).map(member):[]}
}
export const memberName=(m:RoomMember)=>m.displayName.trim()||m.username.trim()||"?"
