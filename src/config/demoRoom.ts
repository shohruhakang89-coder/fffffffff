import type { Json } from "../lib/net/rpcEnvelope"
import { demoRoomJson } from "./demoContent"
import { resetDemoRound } from "./demoRound"
let code="DEMO42",status="lobby"
let config:Json={game_slug:"math-rush",kind:"math",subject_code:"math_arith",exercise_id:0,level:2,mode:"duo",max_players:2,time_limit_sec:120,host_plays:true}
export function demoRoomCall(method:string,params:Json):Json|null {
 if(!method.startsWith("rooms."))return null
 if(method==="rooms.create"){config={...config,...params};code="DEMO42";status="lobby";resetDemoRound()}
 else if(method==="rooms.config")config={...config,...params}
 else if(method==="rooms.start")status="running"
 else if(method==="rooms.leave")status="finished"
 else if(typeof params["code"]==="string"&&params["code"])code=String(params["code"]).toUpperCase()
 return demoRoomJson(code,status,config)
}
