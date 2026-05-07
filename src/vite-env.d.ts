/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project API URL, e.g. https://project-ref.supabase.co. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon public key for browser RLS access. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** When true, practice session length is capped for Playwright E2E. */
  readonly VITE_E2E?: string;
  /** Enables class/unit strict redirects from flat mode routes. */
  readonly VITE_CURRICULUM_V2?: string;
  /** TEMP DEMO: enables "Practice Free" one-click student access from landing page. */
  readonly VITE_ENABLE_PRACTICE_FREE_DEMO?: string;
}
