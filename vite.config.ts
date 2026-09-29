import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// Redirect the bare root to demo mode so the preview shows the full working
// UI without a backend. The demo flag is stored in localStorage after the
// first load, so subsequent client-side navigation works normally.
function demoRedirect() {
  return {
    name: "demo-mode-redirect",
    configureServer(server: { middlewares: { use: (mw: any) => void } }) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url ?? ""
        if (url === "/" || url === "/?" || (url.startsWith("/?") && !url.includes("demo=") && !url.includes("framed="))) {
          res.writeHead(302, { Location: "/?demo=1" })
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), demoRedirect()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
  },
})
