/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When true, practice session length is capped for Playwright E2E. */
  readonly VITE_E2E?: string;
}
