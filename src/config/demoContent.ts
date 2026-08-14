type J=Record<string,unknown>
type Inbox=[number,string,string,string,string,number,number,number]
const ROWS:Inbox[]=[
 [1,"private","Dilnoza","dilnoza","Ertaga oynaymizmi?",4,2,2],
 [2,"group","Keyra Champions","","Azizbek: yangi rekord 128 WPM",38,1,0],
 [3,"channel","Science Club","science","Haftalik bellashuv",180,5,1],
]
const chat=(id:number,type:string,title:string,username:string):J=>({id,type,title,username,about:"",photo_url:"",is_public:type==="channel",creator_id:2,member_count_cached:type==="private"?2:128,created_at:"2026-07-01T09:00:00Z",peer_user_id:type==="private"?2:0})
export const demoInboxJson:J[]=ROWS.map(([cid,type,title,username,preview,mins,sender,unread])=>({chat_id:cid,user_id:1,role:"member",joined_at:"2026-07-01T09:00:00Z",last_message_id:900+cid,last_message_preview:preview,last_message_type:"text",last_message_at:new Date(Date.now()-mins*60000).toISOString(),last_sender_id:sender,last_read_message_id:900+cid-unread,unread_count:unread,is_muted:false,is_pinned:cid===1,chat:chat(cid,type,title,username)}))
const BODIES:Record<string,string>={default:"The quick brown fox jumps over the lazy dog while a calm river flows past the old stone bridge.",code_py:"def solve(n):\n    return sum(range(n))",code_cpp:"int main() { return 0; }"}
export function demoTextJson(category:string):J {const body=BODIES[category]??BODIES.default;return {id:101,category_code:category,lang:"en",difficulty:2,body,word_count:body.split(" ").length,char_count:body.length,source:"demo",is_generated:false}}
export const demoRunJson:J={run:{session_id:1,wpm:96,raw_wpm:104,accuracy:97.8,mistakes:3,correct_keys:210,chars_typed:214,duration_ms:42000,xp_gained:120,suspicious:false,personal_best:true}}
const member=(uid:number,name:string,host:boolean):J=>({user_id:uid,username:name.toLowerCase(),display_name:name,avatar_url:"",role:"player",ready:host,is_host:host})
export function demoRoomJson(code:string,status:string,c:J={}):J {return {room:{id:7,code:code||"DEMO42",host_id:1,game_slug:c["game_slug"]??"math-rush",kind:c["kind"]??"math",subject_code:c["subject_code"]??"math_arith",exercise_id:c["exercise_id"]??0,level:c["level"]??2,mode:c["mode"]??"duo",max_players:c["max_players"]??2,time_limit_sec:c["time_limit_sec"]??120,host_plays:c["host_plays"]??true,status,player_count:c["mode"]==="solo"?1:2},members:c["mode"]==="solo"?[member(1,"Azizbek",true)]:[member(1,"Azizbek",true),member(2,"Dilnoza",false)]}}
