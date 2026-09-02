import "server-only";

import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";
import type { PasswordInput, ProfileInput } from "./schemas";

export async function getAccountData() {
  const { supabase, userId } = await getAuthenticatedUser();
  const [{ data: userData, error: userError }, { data: profile, error: profileError }, { data: administrator, error: administratorError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("first_name,last_name").eq("id", userId).single(),
    supabase.from("platform_administrators").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (userError || !userData.user?.email) throw new Error("Impossible de charger l’adresse e-mail du compte.");
  if (profileError || !profile) throw new Error("Impossible de charger le profil.");
  if (administratorError) throw new Error("Impossible de vérifier le rôle du compte.");

  return {
    firstName: profile.first_name ?? "",
    lastName: profile.last_name ?? "",
    email: userData.user.email,
    isPlatformAdmin: Boolean(administrator),
  };
}

export async function updateOwnProfile(input: ProfileInput) {
  const { supabase, userId } = await getAuthenticatedUser();
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: input.firstName, last_name: input.lastName })
    .eq("id", userId);
  if (error) throw new Error("Impossible de modifier le profil.");
}

export async function updateOwnPassword(input: PasswordInput) {
  const { supabase } = await getAuthenticatedUser();
  return supabase.auth.updateUser({
    password: input.newPassword,
    current_password: input.currentPassword,
  });
}
