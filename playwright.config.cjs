const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function parseEnvFile(content) {
  const out = {};
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

function loadEnvLocal() {
  const p = path.resolve(__dirname, '.env.local');
  if (!fs.existsSync(p)) return {};
  try {
    return parseEnvFile(fs.readFileSync(p, 'utf-8'));
  } catch {
    return {};
  }
}

const envLocal = loadEnvLocal();
const e2eWithDb = process.env.E2E_WITH_DB === '1';

const defaultDbUrl =
  process.env.DATABASE_URL ??
  envLocal.DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:15432/languini';

const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  envLocal.BETTER_AUTH_SECRET ??
  'playwright-test-secret-min-32-characters-long!';

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: e2eWithDb
          ? 'npm run dev -- --hostname 127.0.0.1 --port 3000'
          : 'E2E_SKIP_AUTH=1 npm run dev -- --hostname 127.0.0.1 --port 3000',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: process.env.PW_REUSE_SERVER === '1',
        env: {
          ...envLocal,
          ...process.env,
          E2E_SKIP_AUTH: e2eWithDb ? '0' : '1',
          DATABASE_URL: defaultDbUrl,
          BETTER_AUTH_SECRET: authSecret,
          BETTER_AUTH_URL: 'http://127.0.0.1:3000',
          NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3000',
        },
      },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
