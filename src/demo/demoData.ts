import type { Json } from "../lib/net/rpcEnvelope"

export const DEMO_USER_ID = 1001

export const DEMO_USER: Json = {
  id: DEMO_USER_ID,
  username: "demo",
  display_name: "Demo Player",
  locale: "en",
  country: "UZ",
  rating: 1475,
  tier: "gold",
  xp: 3840,
  level: 9,
  keyboard: "qwerty",
  avatar_url: null,
  role: "user",
}

export const DEMO_SESSION: Json = {
  session_token: "demo-session-token",
  session_id: 1001,
  expires_at: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
}

export const CONTACTS: Json[] = [
  { id: 1002, username: "azizbek", display_name: "Azizbek Rahimov" },
  { id: 1003, username: "malika", display_name: "Malika Karimova" },
  { id: 1004, username: "sardor", display_name: "Sardor Toshpulatov" },
  { id: 1005, username: "jasur", display_name: "Jasur Yusupov" },
]

export const CATEGORIES: Json[] = [
  { id: 1, parent_id: 0, code: "grp_languages", kind: "group", game_kind: "", title_en: "Languages", title_ru: "Языки", title_uz: "Tillar", icon: "book", accent: "#8B7CF6", sort_order: 1 },
  { id: 2, parent_id: 0, code: "grp_code", kind: "group", game_kind: "", title_en: "Code", title_ru: "Код", title_uz: "Kod", icon: "code", accent: "#FFC14E", sort_order: 2 },
  { id: 3, parent_id: 0, code: "grp_subjects", kind: "group", game_kind: "", title_en: "Subjects", title_ru: "Предметы", title_uz: "Fanlar", icon: "graduation", accent: "#00D3A7", sort_order: 3 },
  { id: 4, parent_id: 3, code: "subj_math", kind: "group", game_kind: "", title_en: "Math", title_ru: "Математика", title_uz: "Matematika", icon: "sigma", accent: "#00D3A7", sort_order: 10 },
  { id: 5, parent_id: 1, code: "prose_en", kind: "lang", game_kind: "typing", title_en: "English prose", title_ru: "Английская проза", title_uz: "Ingliz tili matni", icon: "book", accent: "#6366F1", sort_order: 10 },
  { id: 6, parent_id: 1, code: "prose_ru", kind: "lang", game_kind: "typing", title_en: "Russian prose", title_ru: "Русская проза", title_uz: "Rus tili matni", icon: "book", accent: "#8B5CF6", sort_order: 20 },
  { id: 7, parent_id: 1, code: "prose_uz", kind: "lang", game_kind: "typing", title_en: "Uzbek prose", title_ru: "Узбекская проза", title_uz: "Ona tili matni", icon: "book", accent: "#06B6D4", sort_order: 30 },
  { id: 8, parent_id: 1, code: "prose_es", kind: "lang", game_kind: "typing", title_en: "Spanish prose", title_ru: "Испанская проза", title_uz: "Ispan tili matni", icon: "book", accent: "#F59E0B", sort_order: 40 },
  { id: 9, parent_id: 1, code: "prose_tr", kind: "lang", game_kind: "typing", title_en: "Turkish prose", title_ru: "Турецкая проза", title_uz: "Turk tili matni", icon: "book", accent: "#EF4444", sort_order: 50 },
  { id: 10, parent_id: 1, code: "dictation", kind: "lang", game_kind: "typing", title_en: "Dictation", title_ru: "Диктант", title_uz: "Diktant", icon: "mic", accent: "#22C55E", sort_order: 60 },
  { id: 11, parent_id: 2, code: "code_c", kind: "code", game_kind: "typing", title_en: "C", title_ru: "C", title_uz: "C", icon: "code", accent: "#3B82F6", sort_order: 110 },
  { id: 12, parent_id: 2, code: "code_cpp", kind: "code", game_kind: "typing", title_en: "C++", title_ru: "C++", title_uz: "C++", icon: "code", accent: "#2563EB", sort_order: 120 },
  { id: 13, parent_id: 2, code: "code_py", kind: "code", game_kind: "typing", title_en: "Python", title_ru: "Python", title_uz: "Python", icon: "code", accent: "#EAB308", sort_order: 130 },
  { id: 14, parent_id: 2, code: "code_js", kind: "code", game_kind: "typing", title_en: "JavaScript", title_ru: "JavaScript", title_uz: "JavaScript", icon: "code", accent: "#F97316", sort_order: 140 },
  { id: 15, parent_id: 2, code: "code_dart", kind: "code", game_kind: "typing", title_en: "Dart", title_ru: "Dart", title_uz: "Dart", icon: "code", accent: "#0EA5E9", sort_order: 150 },
  { id: 16, parent_id: 2, code: "code_sql", kind: "code", game_kind: "typing", title_en: "SQL", title_ru: "SQL", title_uz: "SQL", icon: "database", accent: "#14B8A6", sort_order: 160 },
  { id: 17, parent_id: 2, code: "code_bash", kind: "code", game_kind: "typing", title_en: "Bash", title_ru: "Bash", title_uz: "Bash", icon: "terminal", accent: "#64748B", sort_order: 170 },
  { id: 18, parent_id: 4, code: "math_arith", kind: "math", game_kind: "math", title_en: "Arithmetic", title_ru: "Арифметика", title_uz: "Arifmetika", icon: "calculator", accent: "#A855F7", sort_order: 210 },
  { id: 19, parent_id: 4, code: "math_algebra", kind: "math", game_kind: "math", title_en: "Algebra", title_ru: "Алгебра", title_uz: "Algebra", icon: "sigma", accent: "#D946EF", sort_order: 220 },
  { id: 20, parent_id: 4, code: "math_formula", kind: "math", game_kind: "math", title_en: "Formulas", title_ru: "Формулы", title_uz: "Formulalar", icon: "function", accent: "#EC4899", sort_order: 230 },
  { id: 21, parent_id: 0, code: "custom", kind: "custom", game_kind: "typing", title_en: "My own text", title_ru: "Мой текст", title_uz: "O'z matnim", icon: "edit", accent: "#94A3B8", sort_order: 900 },
]

export interface SeedText {
  id: number
  category_code: string
  lang: string
  difficulty: number
  body: string
  source: string
}

function seed(id: number, categoryCode: string, lang: string, difficulty: number, body: string, source = "hand"): SeedText {
  return {
    id,
    category_code: categoryCode,
    lang,
    difficulty,
    body,
    source,
  }
}

export const TEXT_POOL: SeedText[] = [
  seed(1, "prose_en", "en", 1, "The morning light spilled across the quiet street and painted the wet cobblestones in shades of gold. A cat stretched lazily on a windowsill while the baker rolled open the shutters, filling the air with the warm smell of fresh bread."),
  seed(2, "prose_en", "en", 2, "Technology is never neutral. Every tool we build carries the values of its makers, and every choice we make shapes the world we share. The question is not whether we use technology, but how we use it, and for whom."),
  seed(3, "prose_en", "en", 3, "Her notes were scattered across the desk like autumn leaves. Some were long, some were short, but every single one was written in the same careful handwriting, the letters leaning forward as if they were in a hurry to be read."),
  seed(4, "prose_ru", "ru", 1, "Утренний свет разлился по тихой улице и окрасил мокрую брусчатку в золотые оттенки. Кот лениво потянулся на подоконнике, а пекарь распахнул ставни, наполнив воздух тёплым запахом свежего хлеба."),
  seed(5, "prose_ru", "ru", 2, "Технологии никогда не бывают нейтральными. Каждый созданный нами инструмент несёт ценности своих создателей, и каждый наш выбор формирует общий мир. Вопрос не в том, пользуемся ли мы технологиями, а в том, как мы это делаем и для кого."),
  seed(6, "prose_uz", "uz", 1, "Ertalabki nur jimjit ko'chaga to'kilib, ho'l toshlarni oltin tusga bo'yadi. Mushuk deraza tokchasida erinchoq cho'zildi, novvoy esa derazalarni ochib, havoni yangi nonning iliq hidiga to'ldirdi."),
  seed(7, "prose_uz", "uz", 2, "Texnologiya hech qachon betaraf bo'lmaydi. Har bir yaratgan qurolimiz yaratuvchilarining qadriyatlarini olib yuradi va har bir tanlovimiz umumiy dunyoni shakllantiradi. Savol texnologiyani ishlatamizmi emas, balki uni qanday va kim uchun ishlatamizdir."),
  seed(8, "prose_es", "es", 1, "La luz de la mañana se derramó sobre la calle tranquila y pintó los adoquines mojados con tonos dorados."),
  seed(9, "prose_tr", "tr", 1, "Sabah ışığı sakin sokağa yayıldı ve ıslak kaldırım taşlarını altın tonlarına boyadı."),
  seed(10, "dictation", "en", 1, "Every great typist was once a beginner. Slow is smooth, and smooth is fast. Focus on accuracy before speed. The keys will remember your effort."),
  seed(11, "dictation", "en", 2, "Practice is the price of progress. Ten minutes of focused typing beats an hour of distraction. Keep your eyes on the screen and let your fingers find the rhythm."),
  seed(12, "code_py", "en", 1, "def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n ** 0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nprint(is_prime(97))"),
  seed(13, "code_py", "en", 2, "from collections import Counter\n\ndef top_words(text):\n    words = text.lower().split()\n    return Counter(words).most_common(5)\n\nprint(top_words(\"type faster think sharper type again\"))"),
  seed(14, "code_cpp", "en", 1, "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, Keyra!\" << std::endl;\n    return 0;\n}"),
  seed(15, "code_js", "en", 1, "const words = (s) => s.trim().split(/\\s+/).length;\nconsole.log(words(\"type faster, think sharper\"));"),
  seed(16, "code_c", "en", 1, "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello from C\\n\");\n    return 0;\n}"),
  seed(17, "code_dart", "en", 1, "void main() {\n  final speeds = [42, 58, 71];\n  final best = speeds.reduce((a, b) => a > b ? a : b);\n  print(best);\n}"),
  seed(18, "code_sql", "en", 1, "SELECT u.username, COUNT(r.id) AS runs\nFROM users u\nLEFT JOIN runs r ON r.user_id = u.id\nGROUP BY u.id\nORDER BY runs DESC\nLIMIT 10;"),
  seed(19, "code_bash", "en", 1, "for f in *.txt; do\n  wc -w \"$f\"\ndone"),
  seed(20, "math_arith", "en", 1, "7 × 8 = 56    12 × 12 = 144    9 × 9 = 81    64 ÷ 8 = 8"),
  seed(21, "math_algebra", "en", 2, "x + 5 = 12 so x = 7    2x = 18 so x = 9    3x - 4 = 20 so x = 8"),
  seed(22, "math_formula", "en", 2, "Area of a circle: A = π r²    Pythagorean theorem: a² + b² = c²"),
  seed(23, "custom", "en", 2, "Type your own text here and practice at your own pace. The screen keeps your rhythm and counts every keystroke."),
]

export const CATALOG_ITEMS: Json[] = [
  { source: "text", id: 1, category_code: "prose_en", game_kind: "typing", lang: "en", level: 1, title: "Morning in the old town", preview: "The morning light spilled across the quiet street...", author_id: 2 },
  { source: "text", id: 2, category_code: "prose_en", game_kind: "typing", lang: "en", level: 2, title: "Tools we build", preview: "Technology is never neutral...", author_id: 1 },
  { source: "text", id: 3, category_code: "prose_en", game_kind: "typing", lang: "en", level: 3, title: "Scattered notes", preview: "Her notes were scattered across the desk...", author_id: 3 },
  { source: "text", id: 4, category_code: "prose_ru", game_kind: "typing", lang: "ru", level: 1, title: "Утро в старом городе", preview: "Утренний свет разлился по тихой улице...", author_id: 2 },
  { source: "text", id: 5, category_code: "prose_ru", game_kind: "typing", lang: "ru", level: 2, title: "Инструменты", preview: "Технологии никогда не бывают нейтральными...", author_id: 1 },
  { source: "text", id: 6, category_code: "prose_uz", game_kind: "typing", lang: "uz", level: 1, title: "Eski shaharcha ertalabi", preview: "Ertalabki nur jimjit ko'chaga to'kilib...", author_id: 2 },
  { source: "text", id: 7, category_code: "prose_uz", game_kind: "typing", lang: "uz", level: 2, title: "Qurollarimiz", preview: "Texnologiya hech qachon betaraf bo'lmaydi...", author_id: 1 },
  { source: "text", id: 8, category_code: "prose_es", game_kind: "typing", lang: "es", level: 1, title: "Mañana", preview: "La luz de la mañana se derramó...", author_id: 4 },
  { source: "text", id: 9, category_code: "prose_tr", game_kind: "typing", lang: "tr", level: 1, title: "Sabah", preview: "Sabah ışığı sakin sokağa yayıldı...", author_id: 4 },
  { source: "text", id: 10, category_code: "dictation", game_kind: "typing", lang: "en", level: 1, title: "Beginner mantra", preview: "Every great typist was once a beginner...", author_id: 5 },
  { source: "text", id: 11, category_code: "dictation", game_kind: "typing", lang: "en", level: 2, title: "Ten minutes", preview: "Practice is the price of progress...", author_id: 5 },
  { source: "text", id: 12, category_code: "code_py", game_kind: "typing", lang: "en", level: 1, title: "is_prime", preview: "def is_prime(n): ...", author_id: 6 },
  { source: "text", id: 13, category_code: "code_py", game_kind: "typing", lang: "en", level: 2, title: "Top words", preview: "from collections import Counter...", author_id: 6 },
  { source: "text", id: 14, category_code: "code_cpp", game_kind: "typing", lang: "en", level: 1, title: "Hello, Keyra!", preview: "#include <iostream> ...", author_id: 6 },
  { source: "text", id: 15, category_code: "code_js", game_kind: "typing", lang: "en", level: 1, title: "Word counter", preview: "const words = (s) => ...", author_id: 6 },
  { source: "text", id: 16, category_code: "code_c", game_kind: "typing", lang: "en", level: 1, title: "Hello from C", preview: "#include <stdio.h> ...", author_id: 6 },
  { source: "text", id: 17, category_code: "code_dart", game_kind: "typing", lang: "en", level: 1, title: "Best speed", preview: "void main() { ... }", author_id: 6 },
  { source: "text", id: 18, category_code: "code_sql", game_kind: "typing", lang: "en", level: 1, title: "Run leaderboard", preview: "SELECT u.username, COUNT(r.id)...", author_id: 6 },
  { source: "text", id: 19, category_code: "code_bash", game_kind: "typing", lang: "en", level: 1, title: "Count words", preview: "for f in *.txt; do ...", author_id: 6 },
  { source: "text", id: 20, category_code: "math_arith", game_kind: "math", lang: "en", level: 1, title: "Times tables", preview: "Quick multiplication drill", author_id: 7 },
  { source: "text", id: 21, category_code: "math_algebra", game_kind: "math", lang: "en", level: 2, title: "Linear equations", preview: "Solve for x", author_id: 7 },
  { source: "text", id: 22, category_code: "math_formula", game_kind: "math", lang: "en", level: 2, title: "Core formulas", preview: "Geometry essentials", author_id: 7 },
]

export interface SeedChat {
  chat: Json
  member: Json
  messages: Json[]
  members: Json[]
}

function chatMember(
  chatId: number,
  userId: number,
  role: string,
  lastMessageId: number,
  preview: string,
  lastMessageType: string,
  lastMessageAt: string,
  lastSenderId: number,
  lastReadMessageId: number,
  unreadCount: number,
): Json {
  return {
    chat_id: chatId,
    user_id: userId,
    role,
    joined_at: "2025-01-15T09:00:00.000Z",
    last_message_id: lastMessageId,
    last_message_preview: preview,
    last_message_type: lastMessageType,
    last_message_at: lastMessageAt,
    last_sender_id: lastSenderId,
    last_read_message_id: lastReadMessageId,
    unread_count: unreadCount,
    is_muted: false,
    is_pinned: chatId === 1,
  }
}

function message(id: number, chatId: number, senderId: number, text: string, createdAt: string, type = "text"): Json {
  return {
    id,
    chat_id: chatId,
    sender_id: senderId,
    message_type: type,
    message_text: text,
    payload: {},
    file_id: "",
    reply_to_id: 0,
    is_deleted: false,
    created_at: createdAt,
  }
}

const H = (min: number) => new Date(Date.now() - min * 60000).toISOString()

export const CHATS: SeedChat[] = [
  {
    chat: { id: 1, type: "private", title: "Azizbek", username: "azizbek", about: "", photo_url: "", is_public: false, creator_id: 1002, member_count_cached: 2, created_at: "2025-02-01T08:00:00.000Z", peer_user_id: 1002 },
    member: chatMember(1, DEMO_USER_ID, "member", 1005, "That PB is going to be mine tomorrow", "text", H(18), 1002, 1003, 2),
    messages: [
      message(1001, 1, 1002, "Yo! Did you see the new race mode?", H(60 * 24 * 3)),
      message(1002, 1, DEMO_USER_ID, "Yeah, I tried it this morning. The matchmaking is instant.", H(60 * 24 * 3 - 30)),
      message(1003, 1, 1002, "Nice. What WPM did you hit?", H(60 * 24 * 2)),
      message(1004, 1, DEMO_USER_ID, "Peaked at 92, averaged 87.", H(60 * 24 * 2 + 10)),
      message(1005, 1, 1002, "That PB is going to be mine tomorrow", H(18)),
    ],
    members: [
      { user_id: DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "member", joined_at: "2025-02-01T08:00:00.000Z" },
      { user_id: 1002, username: "azizbek", display_name: "Azizbek Rahimov", avatar_url: "", role: "member", joined_at: "2025-02-01T08:00:00.000Z" },
    ],
  },
  {
    chat: { id: 2, type: "private", title: "Malika", username: "malika", about: "", photo_url: "", is_public: false, creator_id: 1003, member_count_cached: 2, created_at: "2025-02-10T12:00:00.000Z", peer_user_id: 1003 },
    member: chatMember(2, DEMO_USER_ID, "member", 1010, "Send me the Uzbek texts later", "text", H(45), DEMO_USER_ID, 1010, 0),
    messages: [
      message(1006, 2, DEMO_USER_ID, "Malika, congrats on the tournament win!", H(60 * 5)),
      message(1007, 2, 1003, "Thank you! The final race was so close.", H(60 * 5 - 15)),
      message(1008, 2, DEMO_USER_ID, "I saw — 1 WPM difference, crazy.", H(60 * 5 - 20)),
      message(1009, 2, 1003, "I know! I almost missed the last word.", H(60 * 4)),
      message(1010, 2, DEMO_USER_ID, "Send me the Uzbek texts later", H(45)),
    ],
    members: [
      { user_id: DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "member", joined_at: "2025-02-10T12:00:00.000Z" },
      { user_id: 1003, username: "malika", display_name: "Malika Karimova", avatar_url: "", role: "member", joined_at: "2025-02-10T12:00:00.000Z" },
    ],
  },
  {
    chat: { id: 3, type: "private", title: "Sardor", username: "sardor", about: "", photo_url: "", is_public: false, creator_id: 1004, member_count_cached: 2, created_at: "2025-03-05T10:00:00.000Z", peer_user_id: 1004 },
    member: chatMember(3, DEMO_USER_ID, "member", 1014, "Sure, one more round", "text", H(240), 1004, 1013, 1),
    messages: [
      message(1011, 3, 1004, "Rematch?", H(60 * 7)),
      message(1012, 3, DEMO_USER_ID, "Give me ten minutes, finishing work.", H(60 * 6)),
      message(1013, 3, 1004, "OK, I will pick the category this time 😄", H(60 * 5)),
      message(1014, 3, 1004, "Sure, one more round", H(240)),
    ],
    members: [
      { user_id: DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "member", joined_at: "2025-03-05T10:00:00.000Z" },
      { user_id: 1004, username: "sardor", display_name: "Sardor Toshpulatov", avatar_url: "", role: "member", joined_at: "2025-03-05T10:00:00.000Z" },
    ],
  },
  {
    chat: { id: 4, type: "private", title: "Jasur", username: "jasur", about: "", photo_url: "", is_public: false, creator_id: 1005, member_count_cached: 2, created_at: "2025-04-01T09:30:00.000Z", peer_user_id: 1005 },
    member: chatMember(4, DEMO_USER_ID, "member", 1017, "Practice at 20:00?", "text", H(600), DEMO_USER_ID, 1017, 0),
    messages: [
      message(1015, 4, 1005, "How is your rating climb going?", H(60 * 30)),
      message(1016, 4, DEMO_USER_ID, "Slow but steady. 40 points this week.", H(60 * 20)),
      message(1017, 4, DEMO_USER_ID, "Practice at 20:00?", H(600)),
    ],
    members: [
      { user_id: DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "member", joined_at: "2025-04-01T09:30:00.000Z" },
      { user_id: 1005, username: "jasur", display_name: "Jasur Yusupov", avatar_url: "", role: "member", joined_at: "2025-04-01T09:30:00.000Z" },
    ],
  },
  {
    chat: { id: 5, type: "group", title: "Keyra Squad", username: "keysquad", about: "Daily drills and friendly races.", photo_url: "", is_public: true, creator_id: DEMO_USER_ID, member_count_cached: 128, created_at: "2025-02-15T08:00:00.000Z", peer_user_id: 0 },
    member: chatMember(5, DEMO_USER_ID, "creator", 1021, "Malika: 88 WPM on today's drill 👏", "text", H(30), 1003, 1019, 1),
    messages: [
      message(1018, 5, 1003, "Today's drill: English prose level 3. Everyone try!", H(60 * 2)),
      message(1019, 5, DEMO_USER_ID, "Done — 84 WPM, 97% accuracy.", H(60 * 2 - 10)),
      message(1020, 5, 1004, "85 WPM here. Sardor strikes again.", H(60 * 2 - 15)),
      message(1021, 5, 1003, "88 WPM on today's drill 👏", H(30)),
    ],
    members: [
      { user_id: DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "creator", joined_at: "2025-02-15T08:00:00.000Z" },
      { user_id: 1002, username: "azizbek", display_name: "Azizbek Rahimov", avatar_url: "", role: "admin", joined_at: "2025-02-15T08:05:00.000Z" },
      { user_id: 1003, username: "malika", display_name: "Malika Karimova", avatar_url: "", role: "member", joined_at: "2025-02-16T08:00:00.000Z" },
      { user_id: 1004, username: "sardor", display_name: "Sardor Toshpulatov", avatar_url: "", role: "member", joined_at: "2025-02-18T08:00:00.000Z" },
      { user_id: 1005, username: "jasur", display_name: "Jasur Yusupov", avatar_url: "", role: "member", joined_at: "2025-02-20T08:00:00.000Z" },
    ],
  },
  {
    chat: { id: 6, type: "channel", title: "Keyra Announcements", username: "keyra_news", about: "Product news and updates.", photo_url: "", is_public: true, creator_id: 1, member_count_cached: 4200, created_at: "2025-01-01T00:00:00.000Z", peer_user_id: 0 },
    member: chatMember(6, DEMO_USER_ID, "member", 1024, "Keyra 0.3 is here: live rooms + voice calls", "text", H(60 * 26), 1, 1024, 0),
    messages: [
      message(1022, 6, 1, "Welcome to Keyra 0.3! Live rooms, matchmaking and the games hub are now live.", H(60 * 24 * 5)),
      message(1023, 6, 1, "Tip: keep your fingers home-row for 15% faster transitions between words.", H(60 * 24 * 3)),
      message(1024, 6, 1, "Keyra 0.3 is here: live rooms + voice calls", H(60 * 26)),
    ],
    members: [
      { user_id: 1, username: "keyra", display_name: "Keyra Team", avatar_url: "", role: "creator", joined_at: "2025-01-01T00:00:00.000Z" },
      { user_id: DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "member", joined_at: "2025-01-10T00:00:00.000Z" },
    ],
  },
  {
    chat: { id: 7, type: "group", title: "WPM League", username: "wpm_league", about: "Monthly rating tournaments.", photo_url: "", is_public: true, creator_id: 2, member_count_cached: 56, created_at: "2025-03-01T08:00:00.000Z", peer_user_id: 0 },
    member: chatMember(7, DEMO_USER_ID, "member", 1027, "Qualifiers start on Monday", "text", H(60 * 20), 2, 1026, 1),
    messages: [
      message(1025, 7, 2, "League season 2 registration is open!", H(60 * 24 * 2)),
      message(1026, 7, 1005, "I am in. Target: top 16.", H(60 * 24 * 2 + 30)),
      message(1027, 7, 2, "Qualifiers start on Monday", H(60 * 20)),
    ],
    members: [
      { user_id: 2, username: "league", display_name: "WPM League", avatar_url: "", role: "creator", joined_at: "2025-03-01T08:00:00.000Z" },
      { user_id: DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "member", joined_at: "2025-03-02T08:00:00.000Z" },
      { user_id: 1005, username: "jasur", display_name: "Jasur Yusupov", avatar_url: "", role: "member", joined_at: "2025-03-02T08:10:00.000Z" },
    ],
  },
  {
    chat: { id: 8, type: "channel", title: "Typing Tips", username: "typing_tips", about: "Bite-sized technique tips.", photo_url: "", is_public: true, creator_id: 3, member_count_cached: 890, created_at: "2025-04-10T08:00:00.000Z", peer_user_id: 0 },
    member: chatMember(8, DEMO_USER_ID, "member", 1029, "Accuracy first: never chase speed with errors", "text", H(60 * 8), 3, 1028, 1),
    messages: [
      message(1028, 8, 3, "Accuracy first: never chase speed with errors.", H(60 * 12)),
      message(1029, 8, 3, "Rhythm beats raw force. Type to a metronome at 60 BPM.", H(60 * 8)),
    ],
    members: [
      { user_id: 3, username: "keyratips", display_name: "Keyra Tips", avatar_url: "", role: "creator", joined_at: "2025-04-10T08:00:00.000Z" },
      { user_id: DEMO_USER_ID, username: "demo", display_name: "Demo Player", avatar_url: "", role: "member", joined_at: "2025-04-12T08:00:00.000Z" },
    ],
  },
]

export const DEVICES: Json[] = [
  {
    session_id: 1001,
    platform: "web",
    device: "Windows · Chrome",
    current: true,
    created_at: H(0),
    last_used_at: H(0),
  },
  {
    session_id: 1002,
    platform: "android",
    device: "Samsung Galaxy S23",
    current: false,
    created_at: H(60 * 24 * 6),
    last_used_at: H(60 * 2),
  },
  {
    session_id: 1003,
    platform: "ios",
    device: "iPhone 15",
    current: false,
    created_at: H(60 * 24 * 12),
    last_used_at: H(60 * 24 * 3),
  },
]

export const PUBLIC_CHATS: Json[] = CHATS.filter((c) => c.chat["is_public"] === true).map((c) => c.chat)
