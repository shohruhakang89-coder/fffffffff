export type GameStatus = "live" | "beta" | "coming"
export interface GameManifest {
  slug: string; family: string; gameKind: string; status: GameStatus
  titleEn: string; titleRu: string; titleUz: string
  descriptionEn: string; descriptionRu: string; descriptionUz: string
  icon: string; accent: string; minPlayers: number; maxPlayers: number
  supportsSolo: boolean; supportsRealtime: boolean; supportsRooms: boolean
  supportsSearch: boolean; tags: string[]
}
export interface GameActivity {
  id: string; gameSlug: string; gameKind: string; subjectCode: string
  mode: string; playerCount: number; outcome: string; score: number
  xpGained: number; durationMs: number; createdAt: string
}
type J=Record<string,unknown>
const s=(v:unknown,f="")=>typeof v==="string"?v:f
const n=(v:unknown,f=0)=>typeof v==="number"&&Number.isFinite(v)?Math.trunc(v):f
const b=(v:unknown)=>v===true
export function manifestFromJson(j:J):GameManifest {
 return { slug:s(j["slug"]),family:s(j["family"]),gameKind:s(j["game_kind"]),
  status:s(j["status"],"coming") as GameStatus,titleEn:s(j["title_en"]),titleRu:s(j["title_ru"]),
  titleUz:s(j["title_uz"]),descriptionEn:s(j["description_en"]),descriptionRu:s(j["description_ru"]),
  descriptionUz:s(j["description_uz"]),icon:s(j["icon"],"gamepad"),accent:s(j["accent"],"#007AFF"),
  minPlayers:n(j["min_players"],1),maxPlayers:n(j["max_players"],1),supportsSolo:b(j["supports_solo"]),
  supportsRealtime:b(j["supports_realtime"]),supportsRooms:b(j["supports_rooms"]),
  supportsSearch:b(j["supports_search"]),tags:Array.isArray(j["tags"])?j["tags"].filter((x):x is string=>typeof x==="string"):[] }
}
export function activityFromJson(j:J):GameActivity {
 return { id:s(j["id"]),gameSlug:s(j["game_slug"]),gameKind:s(j["game_kind"]),
  subjectCode:s(j["subject_code"]),mode:s(j["mode"]),playerCount:n(j["player_count"],1),
  outcome:s(j["outcome"],"completed"),score:n(j["score"]),xpGained:n(j["xp_gained"]),
  durationMs:n(j["duration_ms"]),createdAt:s(j["created_at"]) }
}
export function gameTitle(g:GameManifest,locale:string):string {
 return locale.startsWith("uz")&&g.titleUz?g.titleUz:locale.startsWith("ru")&&g.titleRu?g.titleRu:g.titleEn
}
export function gameDescription(g:GameManifest,locale:string):string {
 return locale.startsWith("uz")&&g.descriptionUz?g.descriptionUz:locale.startsWith("ru")&&g.descriptionRu?g.descriptionRu:g.descriptionEn
}
export function hasCapability(g:GameManifest,value:string):boolean {
 return !value||(value==="solo"&&g.supportsSolo)||(value==="live"&&g.supportsRealtime)
}
