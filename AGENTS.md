# AGENTS.md — Keyra Web

## Overview

Keyra is a Vite + React 18 + TypeScript SPA (encrypted typing-race platform client).
This repo contains only the web client — no backend.

## Running the app

```bash
docker compose -f docker-compose.base44.yml up -d
```

The app runs on port 3000 via Vite dev server with live reload.

## Demo mode

The app has a built-in demo mode (no backend needed) activated via `?demo=1`.
The `vite.config.ts` redirects `/` → `/?demo=1` so the preview shows the full
working UI automatically. Demo mode uses local fixtures and a mock RPC client
(`DemoRpcClient`). Exit with `?demo=0` or the Exit Demo action in Profile.

## Without demo mode

The app expects a C++ backend on port 8080 with an encrypted WebSocket protocol.
Without it, the app shows a login page that cannot authenticate. There is no
backend in this repo.

## Key files

- `vite.config.ts` — port 3000, host 0.0.0.0, demo redirect middleware
- `src/config/demo.ts` — demo mode detection and mock RPC dispatch
- `src/store/client.ts` — switches between DemoRpcClient and real RpcClient
- `src/config/env.ts` — API base resolution (same-origin by default)

## Notes

- Vite 5.x (not 6+), so `server.host: true` is used for host allowance
- No external secrets or credentials needed for demo mode
- Dependencies installed via `npm install` on container startup (node_modules in a named volume)
