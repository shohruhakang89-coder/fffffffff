import { BrandMark } from "../../ui/BrandMark"
import { KeyraBackground } from "../../ui/KeyraBackground"

// Shown while the stored session is being validated, so a reload never flashes
// the login form for an already signed-in user.
export function SplashPage() {
  return (
    <KeyraBackground>
      <div className="flex min-h-screen flex-col items-center justify-center gap-8">
        <BrandMark size={34} />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-surfaceHi">
          <div
            className="h-full w-1/2 animate-pulse rounded-full"
            style={{ backgroundImage: "var(--keyra-accent-gradient)" }}
          />
        </div>
      </div>
    </KeyraBackground>
  )
}
