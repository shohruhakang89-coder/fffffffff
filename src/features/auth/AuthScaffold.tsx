import type { ReactNode } from "react"
import { BrandMark } from "../../ui/BrandMark"
import { GlassCard } from "../../ui/GlassCard"
import { KeyraBackground } from "../../ui/KeyraBackground"

interface AuthScaffoldProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

// Centered glass card used by both login and register, responsive everywhere.
export function AuthScaffold({ title, subtitle, children, footer }: AuthScaffoldProps) {
  return (
    <KeyraBackground>
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <BrandMark size={30} showTagline />
          <div className="h-8" />
          <GlassCard>
            <h1 className="text-[22px] font-bold">{title}</h1>
            <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </GlassCard>
          {footer && <div className="mt-4 text-center">{footer}</div>}
        </div>
      </div>
    </KeyraBackground>
  )
}
