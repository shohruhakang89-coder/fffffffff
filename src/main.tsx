import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./design/theme.css"
import "./design/liquid.css"
import "./design/dark.css"

const container = document.getElementById("root")
if (!container) throw new Error("Root element #root not found")

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
