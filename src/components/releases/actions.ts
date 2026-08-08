"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";
import { APP_VERSION } from "@/lib/app";

export async function markCurrentVersionAsSeen() {
  const { supabase, userId } = await getAuthenticatedUser();
  const { error } = await supabase
    .from("profiles")
    .update({ last_seen_version: APP_VERSION })
    .eq("id", userId);

  if (error) throw new Error("Impossible d’enregistrer la version lue.");

  revalidatePath("/", "layout");
}
