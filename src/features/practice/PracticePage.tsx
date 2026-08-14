import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Routes } from "../../app/routes"
import type { PracticeConfig } from "../../models/text"
import { KeyraBackground } from "../../ui/KeyraBackground"
import { fallbackCategoryTitle } from "../../models/catalog"
import { PracticeSurface } from "./PracticeSurface"
import { usePractice } from "./usePractice"

// Reads the practice config passed through router state (or falls back to an
// English drill on a direct visit) and hosts the typing surface.
export function PracticePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const raw = location.state as Partial<PracticeConfig> | null
  const category = raw?.category ?? "prose_en"
  const config = useMemo<PracticeConfig>(
    () => ({
      category,
      lang: raw?.lang,
      difficulty: raw?.difficulty,
      title: raw?.title,
      customBody: raw?.customBody,
    }),
    [category, raw?.lang, raw?.difficulty, raw?.title, raw?.customBody],
  )
  const practice = usePractice(config)
  return (
    <KeyraBackground>
      <PracticeSurface
        title={config.title ?? fallbackCategoryTitle(config.category)}
        practice={practice}
        onExit={() => navigate(Routes.home, { replace: true })}
      />
    </KeyraBackground>
  )
}
