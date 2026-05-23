// Pure factory — no other imports, no module-level execution.
// Receives env vars from the caller (AuthProvider) so Next.js compiler
// inlines them properly at build time.
export async function createSupabaseClient(supabaseUrl, supabaseAnonKey) {
  if (typeof window === "undefined") return null;

  console.log("[supabase] URL exists:", !!supabaseUrl);
  console.log("[supabase] KEY exists:", !!supabaseAnonKey);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return null;
  }

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(supabaseUrl, supabaseAnonKey);
}
