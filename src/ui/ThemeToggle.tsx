import { Moon, Sun } from "lucide-react"
import { useThemeStore } from "../store/themeStore"
export function ThemeToggle({compact=false}:{compact?:boolean}) {
 const theme=useThemeStore(s=>s.theme),setTheme=useThemeStore(s=>s.setTheme),dark=theme==="dark"
 return <button type="button" role="switch" aria-checked={dark} title={`Switch to ${dark?"light":"dark"} mode`} data-dark={dark} onClick={()=>setTheme(dark?"light":"dark")} className={`liquid-toggle pressable flex w-full items-center rounded-[16px] p-1 ${compact?"justify-between":"max-w-[180px]"}`}>
  <span className="toggle-knob"/>
  <span className={`relative z-10 flex h-9 flex-1 items-center justify-center gap-1.5 text-[10px] font-bold ${!dark?"text-accent":"text-muted"}`}><Sun className="h-3.5 w-3.5"/>{!compact&&"Light"}</span>
  <span className={`relative z-10 flex h-9 flex-1 items-center justify-center gap-1.5 text-[10px] font-bold ${dark?"text-accent":"text-muted"}`}><Moon className="h-3.5 w-3.5"/>{!compact&&"Dark"}</span>
 </button>
}
