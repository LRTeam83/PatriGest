import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) throw new Error("UNAUTHENTICATED");

  const [{ data: authorization, error: authorizationError }, { data: administrator, error: administratorError }] = await Promise.all([
    supabase.from("application_user_authorizations").select("status").eq("user_id", userId).maybeSingle(),
    supabase.from("platform_administrators").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (authorizationError || administratorError) {
    throw new Error("Impossible de vérifier l’autorisation d’accès.");
  }

  if (!administrator && authorization?.status !== "active") {
    throw new Error("APPLICATION_ACCESS_DENIED");
  }

  return { supabase, userId };
}
