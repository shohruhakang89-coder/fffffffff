# Keyra Web

React + TypeScript client for Keyra. Production mode uses the same encrypted
socket protocol and opaque sessions as the Flutter client. Demo mode is a
fully local UI showcase.

## Run the UI demo

```bash
cd web
npm install
npm run dev
```

Open:

```text
http://localhost:5173/?demo=1
```

Demo behavior:

- enters immediately without login;
- does not create a backend WebSocket;
- uses local catalog, profile, room, practice and chat fixtures;
- works after route redirects because the demo flag is remembered locally;
- exits with `?demo=0` or the **Exit demo** action in Profile.

If an older Vite process is already running after replacing files, stop it,
start `npm run dev` again and hard-refresh the browser once.

## Production mode

```bash
npm run dev
# /api and /ws are proxied to localhost:8080
```

To use a remote backend:

```bash
echo "VITE_KEYRA_API_BASE=https://api.keyra.app" > .env
npm run build
npm run preview
```

## Layout

- `src/config` - environment and offline demo fixtures
- `src/lib/crypto` - key pinning, X25519, HKDF and encrypted frames
- `src/lib/net` - real and offline RPC transports
- `src/store` - Zustand application state
- `src/design` - tokens and white liquid-glass CSS
- `src/ui` - reusable controls and surfaces
- `src/features` - auth, home, chat, history, profile, games and rooms

The responsive app uses a floating bottom dock on mobile and a floating side
dock on desktop. It never renders a physical phone frame.

## Light and dark themes

Keyra includes persisted `light` and `dark` VisionOS glass themes. The initial
paint uses the saved `keyra.theme` value or the operating-system preference,
so the page does not flash through the wrong theme. Switch themes from the
Home header on mobile, the desktop side dock, or Profile preferences.
