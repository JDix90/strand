import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

/** True when real project URL and anon key are set (not template placeholders). */
export const isSupabaseConfigured: boolean = (() => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (!supabaseUrl.startsWith('https://')) return false;
  // Dashboard links are not API endpoints; using them causes CORS "Failed to fetch"
  if (supabaseUrl.includes('supabase.com/dashboard')) return false;
  // Default template from .env.example — hostname does not resolve (ERR_NAME_NOT_RESOLVED)
  if (/your-project|placeholder/i.test(supabaseUrl)) return false;
  if (/your-anon|placeholder/i.test(supabaseAnonKey)) return false;
  // Real Supabase anon keys are long JWTs; placeholders are short
  if (supabaseAnonKey.length < 80) return false;
  return true;
})();

if (!isSupabaseConfigured) {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
  if (url.includes('supabase.com/dashboard')) {
    console.warn(
      '[Languini] VITE_SUPABASE_URL looks like a dashboard URL. Use Project URL from Settings → API (e.g. https://YOUR_REF.supabase.co), not the dashboard project page.'
    );
  } else {
    console.warn(
      '[Languini] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (from your Supabase project Settings → API).'
    );
  }
}

/** Dummy client when env is invalid — AuthContext never calls it unless `isSupabaseConfigured` is true. */
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://invalid.invalid',
  isSupabaseConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid'
);

export const SUPABASE_SETUP_MESSAGE =
  'Authentication requires a Supabase project. In the Supabase dashboard, create a project, then copy the Project URL and anon public key from Settings → API into .env.local as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Restart the dev server after saving.';
