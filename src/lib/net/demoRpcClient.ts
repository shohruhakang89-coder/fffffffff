import { demoCall } from "../../config/demo"
import type { LinkState } from "./linkState"
import type { Json } from "./rpcEnvelope"
type EventListener=(event:Json)=>void
type StateListener=(state:LinkState)=>void
export class DemoRpcClient {
 private events=new Set<EventListener>()
 get state():LinkState{return "secured"} get pinMismatch(){return false}
 connect():Promise<void>{return Promise.resolve()}
 private emit(event:string,payload:Json){queueMicrotask(()=>this.events.forEach(listener=>listener({event,payload})))}
 async call(method:string,params:Json={}):Promise<Json>{const result=await demoCall(method,params)
  if(method==="chat.send")this.emit("chat.message",{chat_id:Number(params["chat_id"]??0),message_id:Number(result["message_id"]??0),sender_id:1,type:String(params["type"]??"text"),text:String(params["text"]??"")})
  if(method.startsWith("rooms.")&&typeof result["room"]==="object")this.emit("room.updated",result)
  if(method==="game.answer")this.emit("room.progress",{user_id:1,solved:Number(result["solved"]??0),attempts:Number(result["attempts"]??0),finished:result["done"]===true})
  return result}
 onEvent(listener:EventListener){this.events.add(listener);return()=>this.events.delete(listener)}
 onState(listener:StateListener){listener("secured");return()=>{}}
 dispose(){this.events.clear()}
}
