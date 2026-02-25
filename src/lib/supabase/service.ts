import { createClient } from "@supabase/supabase-js";

// Cliente com service_role — bypassa o RLS completamente.
// Usar APENAS nos cron jobs (server-side). Nunca expor no cliente.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
