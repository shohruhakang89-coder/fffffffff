import type { Json } from "../lib/net/rpcEnvelope"
import { userFromJson,type KeyraUser } from "../models/user"
import { demoChatCall } from "./demoChat"
import { demoGameCall } from "./demoRound"
import { demoMarketplaceCall } from "./demoMarketplace"
import { demoRoomCall } from "./demoRoom"
import { demoCategoriesJson,demoSessionsJson,demoStatsJson,demoUserJson } from "./demoData"
import { demoRunJson,demoTextJson } from "./demoContent"
const KEY="keyra.demo"
const query=()=>typeof window==="undefined"?new URLSearchParams():new URLSearchParams(window.location.search)
export function isDemo():boolean {if(typeof window==="undefined")return false;const flag=query().get("demo");try{if(flag==="1")localStorage.setItem(KEY,"1");if(flag==="0")localStorage.removeItem(KEY);return flag==="1"||localStorage.getItem(KEY)==="1"}catch{return flag==="1"}}
export function exitDemo(){try{localStorage.removeItem(KEY)}finally{location.assign("/?demo=0")}}
export function isFramed():boolean{return typeof window!=="undefined"&&query().get("framed")==="1"}
export const demoUser=():KeyraUser=>userFromJson(demoUserJson)
const reply=(v:Json)=>new Promise<Json>(resolve=>setTimeout(()=>resolve(v),70))
function items():Json[]{return demoCategoriesJson.filter(x=>typeof x["game_kind"]==="string"&&x["game_kind"]!=="").map((x,i)=>({source:x["game_kind"]==="math"?"exercise":"text",id:i+1,category_code:x["code"],game_kind:x["game_kind"],lang:"en",level:i%3+1,title:x["title_en"],preview:x["game_kind"]==="math"?"A focused problem set with verified answers.":"A focused typing drill.",author_id:1}))}
export function demoCall(method:string,params:Json={}):Promise<Json>{
 for(const call of [demoChatCall,demoMarketplaceCall,demoRoomCall,demoGameCall]){const value=call(method,params);if(value!==null)return reply(value)}
 switch(method){
  case "auth.login":case "auth.register":return reply({session:{session_token:"demo",session_id:1},user:demoUserJson})
  case "auth.logout":case "auth.rotate":case "me.password":case "sessions.revoke":case "sessions.revoke_others":return reply({})
  case "me.get":return reply(demoUserJson);case "me.update":return reply({...demoUserJson,...params})
  case "catalog.tree":return reply({categories:demoCategoriesJson})
  case "catalog.search":{const q=String(params["q"]??"").toLowerCase(),cat=String(params["category"]??""),kind=String(params["game_kind"]??""),level=Number(params["level"]??0);return reply({items:items().filter(x=>{const h=`${x["title"]} ${x["category_code"]} ${x["preview"]}`.toLowerCase();return(!q||h.includes(q))&&(!cat||x["category_code"]===cat)&&(!kind||x["game_kind"]===kind)&&(!level||x["level"]===level)})})}
  case "stats.me":return reply(demoStatsJson)
  case "texts.random":case "texts.custom":return reply({text:demoTextJson(String(params["category"]??"default"))})
  case "practice.submit":return reply(demoRunJson);case "sessions.list":return reply({items:demoSessionsJson})
  default:return reply({})
 }
}
