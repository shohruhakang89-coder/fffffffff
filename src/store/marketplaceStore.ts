import { create } from "zustand"
import * as api from "../api/marketplaceApi"
import { ApiError } from "../lib/net/apiError"
import type { GameManifest } from "../models/marketplace"
type Status="idle"|"loading"|"ready"|"error"
interface Store { status:Status; games:GameManifest[]; error:string|null; load:(force?:boolean)=>Promise<void> }
export const useMarketplaceStore=create<Store>((set,get)=>({
 status:"idle",games:[],error:null,
 load:async(force=false)=>{ if(!force&&["ready","loading"].includes(get().status))return
  set({status:"loading",error:null})
  try{set({status:"ready",games:await api.games(),error:null})}
  catch(error){set({status:"error",error:error instanceof ApiError?error.message:"Could not load games"})}
 },
}))
