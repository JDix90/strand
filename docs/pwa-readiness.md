# PWA readiness (documentation)

Phase 1 does **not** require shipping a service worker. This note captures what a future PWA release would need.

## Manifest

- Add a **web app manifest** (`manifest.webmanifest` or Vite PWA plugin output): `name`, `short_name`, `start_url`, `display`, `theme_color`, `background_color`.
- **Icons:** 192×192 and 512×512 PNGs; include **maskable** safe zone for Android.

## Service worker

- **v1 recommendation:** no offline gameplay; optional **installability** only after stable caching strategy.
- If added later: document **update** flow (skip waiting, refresh prompt) and **cache scope** (static assets only vs. API).

## Meta tags

- HTML **`theme-color`** aligned with app shell.
- **Apple:** `apple-touch-icon`, `apple-mobile-web-app-capable` if standalone mode is desired.

## Offline scope (future)

- Possible future: cache read-only reference (e.g. case metadata) — **not** mastery or session state without conflict resolution.

## Strand / Languini today

- No service worker is bundled by default; users rely on network for Supabase sync. Revisit when install prompts and push are product priorities.
