import { createClient } from '@supabase/supabase-js';

// Service-role client. Use ONLY inside server-side route handlers
// (e.g. /admin/equipo invite endpoint). Never import this from a
// Client Component or expose its key.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
