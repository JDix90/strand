# Languini (Phase 1)

Phase 1 is a simplified Russian practice app with:
- Home
- Case Practice (Focused Drill setup + round runner)
- Vocabulary (single starter deck translation practice)

There is no authentication, no class system, and no backend services.

## Tech

- React 19
- TypeScript
- Vite 8
- Tailwind v4
- Zustand
- React Router 7

## Run locally

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Typecheck and build
- `npm run lint` - Run ESLint
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run Playwright tests

## Notes

- Progress is stored locally in the browser via `localStorage`.
- `.env.example` is intentionally empty for Phase 1.
