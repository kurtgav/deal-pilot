import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

/**
 * Server-side Supabase clients.
 *
 * - `supabaseAuth`: uses the ANON key. Used to verify a user JWT via
 *   `supabaseAuth.auth.getUser(token)` — this calls Supabase Auth which
 *   validates the signature and returns the user. No DB privileges
 *   beyond what the user themselves has (RLS still applies on queries).
 *
 * - `supabaseAdmin`: uses the SERVICE ROLE key. Bypasses RLS. Use ONLY
 *   for trusted server logic (e.g. assigning roles in user_roles, sending
 *   admin emails). NEVER expose to the client.
 */
const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error(
    '[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY — auth middleware will reject all requests.',
  );
}
if (!serviceRoleKey) {
  console.warn(
    '[supabase] Missing SUPABASE_SERVICE_ROLE_KEY — admin operations will fail. Set it for server-only writes.',
  );
}

export const supabaseAuth = createClient(url ?? '', anonKey ?? '', {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws as any },
});

export const supabaseAdmin = createClient(
  url ?? '',
  serviceRoleKey ?? anonKey ?? '',
  {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as any },
  },
);
