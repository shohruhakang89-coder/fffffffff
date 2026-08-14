import type { Json } from "../lib/net/rpcEnvelope"
type Game=[string,string,string,string,string,string,string,string,string,string,number,number,boolean,boolean,boolean,boolean,string[],number]
const DATA:Game[]=[
 ["math-rush","subjects","math","live","Math Rush","Matematika poygasi","Choose a topic or exact problem, then solve first.","Mavzu yoki misol tanlab birinchi yeching.","sigma","#007AFF",1,8,true,true,true,true,["math","subjects","live"],10],
 ["typing-arena","skills","typing","live","Typing Arena","Yozish arenasi","Languages and code typing drills.","Tillar va kod yozish mashqlari.","keyboard","#5E5CE6",1,1,true,false,false,true,["typing","languages","code"],20],
 ["quiz-clash","quiz","quiz","beta","Quiz Clash","Quiz jangi","Fast knowledge rounds for friends.","Dostlar bilan tezkor bilim bellashuvi.","sparkles","#FF9F0A",1,8,true,true,true,true,["quiz","knowledge"],30],
 ["code-quest","skills","code","beta","Code Quest","Kod sarguzashti","Solve practical programming challenges.","Amaliy dasturlash masalalarini yeching.","code","#30B0C7",1,6,true,true,true,true,["code","programming"],40],
 ["science-duel","subjects","science","beta","Science Duel","Fanlar dueli","Compete across useful science topics.","Foydali fan mavzularida bellashing.","flask","#30D158",1,8,true,true,true,true,["science","subjects"],50],
 ["logic-lab","logic","logic","beta","Logic Lab","Mantiq laboratoriyasi","Train reasoning with compact puzzles.","Topishmoqlar bilan mantiqni oshiring.","brain","#BF5AF2",1,4,true,true,true,false,["logic","puzzles"],60],
 ["memory-grid","memory","memory","beta","Memory Grid","Xotira kataklari","Remember patterns and improve focus.","Naqshlarni eslab diqqatni oshiring.","grid","#FF375F",1,4,true,true,true,false,["memory","focus"],70],
]
export const demoGamesJson:Json[]=DATA.map(([slug,family,kind,status,en,uz,descEn,descUz,icon,accent,min,max,solo,realtime,rooms,search,tags,sort])=>({slug,family,game_kind:kind,status,title_en:en,title_ru:en,title_uz:uz,description_en:descEn,description_ru:descEn,description_uz:descUz,icon,accent,min_players:min,max_players:max,supports_solo:solo,supports_realtime:realtime,supports_rooms:rooms,supports_search:search,tags,sort_order:sort}))
export const demoActivityJson:Json[]=[
 {id:"game-1",game_slug:"math-rush",game_kind:"math",subject_code:"math_arith",mode:"duo",player_count:2,outcome:"won",score:10,xp_gained:90,duration_ms:84000,created_at:"2026-08-07T10:20:00Z"},
 {id:"typing-1",game_slug:"typing-arena",game_kind:"typing",subject_code:"code_py",mode:"solo",player_count:1,outcome:"completed",score:96,xp_gained:120,duration_ms:42000,created_at:"2026-08-06T13:10:00Z"},
 {id:"game-2",game_slug:"math-rush",game_kind:"math",subject_code:"math_algebra",mode:"multi",player_count:4,outcome:"finished",score:8,xp_gained:70,duration_ms:103000,created_at:"2026-08-05T16:45:00Z"},
]
export function demoMarketplaceCall(method:string,_params:Json={}):Json|null {
 if(method==="games.list")return {games:demoGamesJson}
 if(method==="games.history")return {items:demoActivityJson}
 return null
}
