import type { Json } from "../lib/net/rpcEnvelope"
const prompts=["8 + 7 = ?","12 - 5 = ?","6 x 4 = ?","36 / 6 = ?","9 + 14 = ?"]
const answers=["15","7","24","6","23"]
let solved=0,attempts=0
export function resetDemoRound(){solved=0;attempts=0}
function snapshot():Json { return {round:{id:70,room_id:7,kind:"math",subject_code:"math_arith",level:2,problem_count:prompts.length,problems:prompts.map((prompt,index)=>({index,prompt})),status:solved>=prompts.length?"finished":"running",started_at:new Date(Date.now()-24000).toISOString()},results:[{user_id:1,username:"azizbek",display_name:"Azizbek",avatar_url:"",solved,attempts,elapsed_ms:solved>=prompts.length?36000:0,finished:solved>=prompts.length},{user_id:2,username:"dilnoza",display_name:"Dilnoza",avatar_url:"",solved:Math.max(0,solved-1),attempts:Math.max(0,attempts-1),elapsed_ms:0,finished:false}]}}
export function demoGameCall(method:string,params:Json):Json|null {
 if(method==="game.round")return snapshot()
 if(method!=="game.answer")return null
 const correct=String(params["answer"]??params["value"]??"").trim()===answers[solved]
 attempts+=1;if(correct)solved+=1
 return {ok:true,correct,solved,attempts,done:solved>=prompts.length,round_finished:solved>=prompts.length,...snapshot()}
}
