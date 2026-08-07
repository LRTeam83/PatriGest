"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { managementPeriodSchema } from "./schemas/management-period-schema";
import { protectedPersonSchema } from "./schemas/protected-person-schema";
import { protectionMeasureSchema } from "./schemas/protection-measure-schema";
import {
  createManagementPeriod,
  createProtectedPerson,
  createProtectionMeasure,
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
    return { status: "success", message: "L’exercice de gestion a été créé." };
  } catch {
    return { status: "error", message: "Impossible de créer l’exercice. Vérifiez qu’il n’existe pas déjà." };
  }
}
