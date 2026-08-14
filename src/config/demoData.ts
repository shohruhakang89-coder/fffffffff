type J=Record<string,unknown>
export const demoUserJson:J={id:1,username:"azizbek",display_name:"Azizbek",locale:"uz",country:"UZ",rating:1840,tier:"gold",xp:12450,level:16,keyboard:"qwerty",avatar_url:null,role:"user"}
export const demoStatsJson:J={runs:342,games_played:418,wins:126,best_wpm:128,avg_wpm:92,avg_accuracy:97.4,total_time_ms:5400000,rank:42}
type Row=[number,number,string,string,string,string,string,string,string,number]
const CATS:Row[]=[
 [1,0,"grp_languages","group","","Languages","Tillar","book","#0A84FF",1],
 [2,0,"grp_code","group","","Code","Kod","code","#FF9F0A",2],
 [3,0,"grp_subjects","group","","Subjects","Fanlar","graduation","#30D158",3],
 [4,3,"subj_math","group","","Math","Matematika","sigma","#0A84FF",1],
 [11,1,"prose_en","lang","typing","English","Ingliz tili","book","#0A84FF",1],
 [12,1,"prose_ru","lang","typing","Russian","Rus tili","graduation","#5E5CE6",2],
 [13,1,"prose_uz","lang","typing","Native language","Ona tili","edit","#FF375F",3],
 [21,2,"code_py","code","typing","Python","Python","terminal","#FF9F0A",1],
 [22,2,"code_cpp","code","typing","C++","C++","code","#FF3B30",2],
 [23,2,"code_sql","code","typing","SQL","SQL","database","#30B0C7",3],
 [31,4,"math_arith","math","math","Arithmetic","Arifmetika","calculator","#30D158",1],
 [32,4,"math_algebra","math","math","Algebra","Algebra","sigma","#0A84FF",2],
 [33,4,"math_formula","math","math","Formulas","Formulalar","brain","#BF5AF2",3],
]
export const demoCategoriesJson:J[]=CATS.map(([id,parent,code,kind,gameKind,en,uz,icon,accent,order])=>({id,parent_id:parent,code,kind,game_kind:gameKind,title_en:en,title_uz:uz,title_ru:en,icon,accent,sort_order:order}))
export const demoSessionsJson:J[]=[{id:1,device:"iPhone 15 Pro",platform:"ios",last_seen_at:new Date().toISOString(),current:true},{id:2,device:"MacBook Air",platform:"web",last_seen_at:"2026-08-05T20:12:00Z",current:false}]
