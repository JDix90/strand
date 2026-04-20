import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');

/**
 * Corpus integrity without Supabase. Full “open unit → practice → results” needs auth + seeded DB.
 */
test.describe('vocabulary corpus', () => {
  test('validate:vocab passes (unique lemmaIds, MC sanity)', () => {
    const out = execSync('npm run validate:vocab', {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    expect(out).toMatch(/OK:\s*28 decks/);
  });
});
