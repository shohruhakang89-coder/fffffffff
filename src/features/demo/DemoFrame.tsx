import { useEffect, useState, type ReactNode } from "react";
import { isDemo, isFramed } from "../../config/demo";

function useWideViewport(): boolean {
  const initial =
    typeof window !== "undefined" ? window.innerWidth >= 760 : true;
  const [wide, setWide] = useState(initial);
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return wide;
}

function framedSrc(): string {
  const url = new URL(window.location.href);
  url.searchParams.set("demo", "1");
  url.searchParams.set("framed", "1");
  return url.pathname + url.search;
}

// On a desktop viewport the ?demo=1 build is shown inside a real iPhone shell.
// The app runs inside an iframe (its own narrow viewport) so the mobile layout
// and the fixed tab bar behave exactly as they do on a phone. On a phone-sized
// window, or inside the iframe itself, we just render the app directly.
export function DemoFrame({ children }: { children: ReactNode }) {
  const wide = useWideViewport();
  if (!isDemo() || isFramed() || !wide) return <>{children}</>;

  return (
    <div className="demo-stage">
      <p className="demo-hint">Keyra demo - open ?demo=0 to exit</p>
      <div className="demo-phone">
        <span className="demo-island" />
        <iframe
          className="demo-screen"
          title="Keyra iPhone demo"
          src={framedSrc()}
        />
      </div>
    </div>
  );
}
