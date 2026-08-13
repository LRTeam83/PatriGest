"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { managementPeriodSchema } from "./schemas/management-period-schema";
import { protectedPersonSchema } from "./schemas/protected-person-schema";
import { protectionMeasureSchema } from "./schemas/protection-measure-schema";
import {
  createManagementPeriod,
  closeManagementPeriod,
  createProtectedPerson,
  createProtectionMeasure,
  deleteProtectedPerson,
  reopenManagementPeriod,
  updateManagementPeriod,
} from "./services/protected-person-service";
import type { ProtectedPersonActionState } from "./state";

function validationError(error: z.ZodError): ProtectedPersonActionState {
  return { status: "error", message: "Vérifiez les informations saisies.", fieldErrors: error.flatten().fieldErrors };
}

export async function createProtectedPersonAction(
  _state: ProtectedPersonActionState,
  formData: FormData,
): Promise<ProtectedPersonActionState> {
  const parsed = protectedPersonSchema.safeParse({
    firstName: formData.get("firstName"), lastName: formData.get("lastName"),
    birthName: formData.get("birthName"), birthDate: formData.get("birthDate"),
    addressLine1: formData.get("addressLine1"), addressLine2: formData.get("addressLine2"),
    postalCode: formData.get("postalCode"), city: formData.get("city"),
  });
  if (!parsed.success) return validationError(parsed.error);

  let person;
  try {
    person = await createProtectedPerson(parsed.data);
  } catch {
    return { status: "error", message: "Impossible de créer le dossier. Veuillez réessayer." };
  }

  revalidatePath("/dossiers");
  revalidatePath("/tableau-de-bord");
  redirect(`/dossiers/${person.id}`);
}

export async function addProtectionMeasureAction(
  protectedPersonId: string,
  _state: ProtectedPersonActionState,
  formData: FormData,
): Promise<ProtectedPersonActionState> {
  if (!z.uuid().safeParse(protectedPersonId).success) return { status: "error", message: "Dossier invalide." };
  const parsed = protectionMeasureSchema.safeParse({
    measureType: formData.get("measureType"), startDate: formData.get("startDate"), decisionDate: formData.get("decisionDate"),
  });
  if (!parsed.success) return validationError(parsed.error);

  try {
    await createProtectionMeasure(protectedPersonId, parsed.data);
    revalidatePath(`/dossiers/${protectedPersonId}`);
    return { status: "success", message: "La mesure de protection a été ajoutée." };
  } catch {
    return { status: "error", message: "Impossible d’ajouter la mesure. Veuillez réessayer." };
  }
}

export async function deleteProtectedPersonAction(protectedPersonId: string, _state: ProtectedPersonActionState, _formData: FormData): Promise<ProtectedPersonActionState> {
  void _state;
  void _formData;
  if (!z.uuid().safeParse(protectedPersonId).success) return { status: "error", message: "Dossier invalide." };
  try { await deleteProtectedPerson(protectedPersonId); }
  catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Impossible de supprimer ce dossier." }; }
  revalidatePath("/dossiers");
  revalidatePath("/dossiers/gestion");
  revalidatePath("/tableau-de-bord");
  redirect("/dossiers/gestion");
}

export async function addManagementPeriodAction(
  protectedPersonId: string,
  _state: ProtectedPersonActionState,
  formData: FormData,
): Promise<ProtectedPersonActionState> {
  if (!z.uuid().safeParse(protectedPersonId).success) return { status: "error", message: "Dossier invalide." };
  const parsed = managementPeriodSchema.safeParse({ startDate: formData.get("startDate"), endDate: formData.get("endDate") });
  if (!parsed.success) return validationError(parsed.error);

  try {
    await createManagementPeriod(protectedPersonId, parsed.data);
    revalidatePath(`/dossiers/${protectedPersonId}`);
    revalidatePath(`/dossiers/${protectedPersonId}/exercices`);
    return { status: "success", message: "L’exercice de gestion a été créé." };
  } catch {
    return { status: "error", message: "Impossible de créer l’exercice. Vérifiez qu’il n’existe pas déjà." };
  }
}

export async function updateManagementPeriodAction(protectedPersonId: string, periodId: string, _state: ProtectedPersonActionState, formData: FormData): Promise<ProtectedPersonActionState> {
  if (![protectedPersonId, periodId].every((id) => z.uuid().safeParse(id).success)) return { status: "error", message: "Exercice invalide." };
  const parsed = managementPeriodSchema.safeParse({ startDate: formData.get("startDate"), endDate: formData.get("endDate") });
  if (!parsed.success) return validationError(parsed.error);
  try { await updateManagementPeriod(protectedPersonId, periodId, parsed.data); revalidatePath(`/dossiers/${protectedPersonId}`); revalidatePath(`/dossiers/${protectedPersonId}/exercices`); return { status: "success", message: "L’exercice a été modifié." }; }
  catch { return { status: "error", message: "Impossible de modifier cet exercice." }; }
}

export async function closeManagementPeriodAction(protectedPersonId: string, periodId: string) {
  if (![protectedPersonId, periodId].every((id) => z.uuid().safeParse(id).success)) return;
  await closeManagementPeriod(protectedPersonId, periodId);
  revalidatePath(`/dossiers/${protectedPersonId}`);
  revalidatePath(`/dossiers/${protectedPersonId}/exercices`);
  redirect(`/dossiers/${protectedPersonId}/exercices`);
}

export async function reopenManagementPeriodAction(protectedPersonId: string, periodId: string, _state: ProtectedPersonActionState, _formData: FormData): Promise<ProtectedPersonActionState> {
  void _state;
  void _formData;
  if (![protectedPersonId, periodId].every((id) => z.uuid().safeParse(id).success)) return { status: "error", message: "Exercice invalide." };
  try {
    await reopenManagementPeriod(protectedPersonId, periodId);
    revalidatePath(`/dossiers/${protectedPersonId}`);
    revalidatePath(`/dossiers/${protectedPersonId}/exercices`);
    return { status: "success", message: "L’exercice a été réouvert." };
  } catch {
    return { status: "error", message: "Impossible de réouvrir cet exercice." };
  }
}
