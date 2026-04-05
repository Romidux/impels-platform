import { createClient } from "@supabase/supabase-js";

/**
 * Admin client using the service_role key.
 * ONLY use in Server Actions or API Routes — never expose to the browser.
 * Bypasses RLS completely.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
