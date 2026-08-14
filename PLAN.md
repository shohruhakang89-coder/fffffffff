# Keyra Web - Plan

The web client is a third front end next to `flutter/` and `backend/`. It talks
to the same C++ backend over the same encrypted socket, so anything the Flutter
app can do, the web app can do too.

## Stack (modern, boring-on-purpose)

- **Vite + React 18 + TypeScript** - fast SPA, no SSR to complicate the crypto
  handshake.
- **React Router v6** - routing and guards.
- **Zustand** - small typed state stores (link, auth, practice).
- **Tailwind CSS v3** + CSS variables - the Keyra dark glassmorphism look,
  mirrored from `flutter/lib/design/tokens.dart`.
- **@noble/curves, @noble/hashes, @noble/ciphers** - audited crypto for X25519,
  Ed25519, HKDF-SHA256 and XChaCha20-Poly1305. Matches libsodium on the server
  byte for byte.

## Backend contract (must match exactly)

- `GET /api/v1/crypto/server-key` -> pin `ed25519_pub`, `x25519_pub`, `key_id`.
- Socket `GET /ws/v1?platform=web`.
- Handshake: server `hi` -> client `hello` -> server `ready` (Ed25519 signed
  over `"keyra-handshake-v1:" || sePub || cePub || cNonce || sNonce`).
- Key schedule: `ikm = X25519(ce,se) || X25519(ce,sStatic)`,
  `salt = cNonce || sNonce`,
  `HKDF-SHA256(info="keyra-secure-channel-v1", 112)` ->
  `txKey32 | rxKey32 | txPrefix16 | rxPrefix16 | channelId16`.
- Frames `{"t":"d","s":seq,"b":b64u(ct||mac)}`, nonce `prefix || be64(seq)`,
  aad `be64(seq)`, XChaCha20-Poly1305.
- RPC `{"id","m","p"}` -> `{"id","ok","data"}` / error; events `{"t":"event"}`.

## Structure

- `src/config` - env.
- `src/lib/crypto` - b64, serverKey, channelKeys, secureChannel.
- `src/lib/net` - apiError, rpcEnvelope, linkState, retryPolicy,
  secureSocketLink, rpcClient.
- `src/lib/storage` - sessionStorage (localStorage).
- `src/store` - Zustand stores.
- `src/design` - tokens + Tailwind theme.
- `src/ui/components` - GlassCard, KeyraButton, LinkBadge, ...
- `src/features` - auth, home, profile, practice + router.

Every file stays <= 150 lines, ASCII only, same rule as the rest of Keyra.

## Milestones

- **W-M0** foundation: scaffold, design system, crypto, secure socket, RPC.
- **W-M1** auth: splash, login, register, session persistence, devices.
- **W-M2** practice: categories, typing engine, live stats, results, custom text.
- **W-M3+** stats, race, presence, ratings - after the backend milestones land.

## Honesty

This sandbox has no network, so `npm install` / `vite build` cannot run here.
The code is written to compile and run once installed on a real machine:
`cd web && npm install && npm run dev` with the backend on :8080.
