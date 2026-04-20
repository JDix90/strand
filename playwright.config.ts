import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Minimal .env parser so the dev server always sees VITE_* (avoids reusing a stale `npm run dev`). */
function parseEnvFile(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadEnvLocal(): Record<string, string> {
  const p = resolve(__dirname, '.env.local');
  if (!existsSync(p)) return {};
  try {
    return parseEnvFile(readFileSync(p, 'utf-8'));
  } catch {
    return {};
  }
}

const envLocal = loadEnvLocal();

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        /** Short practice sessions for authenticated flow tests. */
        command: 'VITE_E2E=true npm run dev -- --host 127.0.0.1 --port 5173',
        url: 'http://127.0.0.1:5173',
        /**
         * Default false: always spawn a dev server with env from `.env.local` merged below.
         * Set `PW_REUSE_SERVER=1` to reuse an existing server on :5173 (must already have Supabase env).
         */
        reuseExistingServer: process.env.PW_REUSE_SERVER === '1',
        env: {
          ...envLocal,
          ...process.env,
          VITE_E2E: 'true',
        },
      },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
