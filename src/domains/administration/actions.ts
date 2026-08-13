"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deletePlatformUser } from "./services/administration-service";
import type { DeleteUserState } from "./state";

export async function deletePlatformUserAction(userId: string, _state: DeleteUserState, _formData: FormData): Promise<DeleteUserState> {
  void _state;
  void _formData;
  if (!z.uuid().safeParse(userId).success) return { status: "error", message: "Utilisateur invalide." };
  try { await deletePlatformUser(userId); }
  catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Impossible de supprimer cet utilisateur." }; }
  revalidatePath("/administration");
  revalidatePath("/administration/utilisateurs");
  return { status: "success", message: "L’utilisateur a été supprimé." };
}
