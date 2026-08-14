import type { Json } from "../lib/net/rpcEnvelope"
import { activityFromJson,manifestFromJson,type GameActivity,type GameManifest } from "../models/marketplace"
import { rpc } from "../store/client"
const list=(v:unknown):Json[]=>Array.isArray(v)?v.filter((x):x is Json=>typeof x==="object"&&x!==null):[]
export async function games():Promise<GameManifest[]> {
 const data=await rpc.call("games.list"); return list(data["games"]).map(manifestFromJson)
}
export async function history(limit=30):Promise<GameActivity[]> {
 const data=await rpc.call("games.history",{limit}); return list(data["items"]).map(activityFromJson)
}
