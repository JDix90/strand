# Baseline Metrics

Generated: 2026-05-07

## Data scale

- `allForms`: 372
- `questionTemplates`: 162
- Sample mastery records profiled: 300

## Runtime baseline

From `npm run measure:baseline`:

- Question generation iterations: 5000
- Question generation median: 0.0316 ms
- Question generation p95: 0.0392 ms
- Question generation total: 158.96 ms

## Persistence size estimate

From `npm run measure:baseline`:

- Serialized mastery map (300 records): 70,857 bytes (~69.2 KB)

## Local pipeline baseline (developer machine)

- `npm run lint`: ~4.2s
- `npm run test:unit -- --coverage`: ~2.9s
- `npx playwright test tests/e2e/phase1-happy-path.spec.ts`: ~8.7s

## Metrics planned for instrumentation (Phase 3)

- Answer-to-next-question latency p95 in `CasePracticeRunScreen`
- Write frequency and payload size in `storage.ts`
- Render count/rerender hotspots in `CasePracticeRunScreen`
- CI median and p95 duration by job

## Final verify snapshot (post-optimization)

- `npm run lint`: pass
- `npm run test:unit -- --coverage`: pass
- `npm run build`: pass
- `npx playwright test tests/e2e/phase1-happy-path.spec.ts`: pass

From `npm run measure:baseline` after optimization:

- Question generation median: 0.0347 ms
- Question generation p95: 0.2615 ms
- Question generation total (5000): 678.4 ms
- Serialized mastery estimate (300 records): 70,857 bytes (~69.2 KB)
