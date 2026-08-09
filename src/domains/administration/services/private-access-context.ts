import "server-only";

import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";

export type PrivateAccessContext = {
  isPlatformAdmin: boolean;
};

export async function getPrivateAccessContext(): Promise<PrivateAccessContext> {
  const { supabase, userId } = await getAuthenticatedUser();
  const { data: administrator, error: administratorError } = await supabase
    .from("platform_administrators")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (administratorError) {
    throw new Error("Impossible de déterminer l’espace utilisateur.");
  }

  return { isPlatformAdmin: Boolean(administrator) };
}
