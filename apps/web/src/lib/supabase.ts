import { createClient } from '@supabase/supabase-js';

/**
 * Supabase browser client.
 *
 * Uses the public anon key — safe to ship in the client bundle.
 * Row Level Security on the database is what actually protects data,
 * NOT obscuring this key.
 *
 * Auth options:
 *   - persistSession: keep the session in localStorage across reloads
 *   - autoRefreshToken: refresh access_token before it expires (every
 *     refresh re-runs our custom_access_token_hook, picking up any
 *     role/permission changes — though the user typically still has
 *     to sign out + in to see changes immediately)
 *   - detectSessionInUrl: handle OAuth/magic-link redirects
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Fail loudly in dev. In production, the build should have these set.
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — auth will not work.',
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
