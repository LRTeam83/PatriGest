"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";
import {
  managementReportCreateSchema,
  managementReportTransmissionSchema,
  managementReportUpdateSchema,
} from "./schemas";
import {
  createManagementReport,
  getManagementReportSnapshot,
  updateManagementReport,
  updateManagementReportStatus,
} from "./services";
import type { ManagementReportStatusActionState } from "./state";
export async function createManagementReportAction(
  personId: string,
  formData: FormData,
) {
  const parsed = managementReportCreateSchema.safeParse({
    managementPeriodId: formData.get("managementPeriodId"),
    periodStart: formData.get("periodStart"),
    periodEnd: formData.get("periodEnd"),
    reportYear: formData.get("reportYear"),
  });
  if (!parsed.success) throw new Error("Période invalide.");
  const report = await createManagementReport(personId, parsed.data);
  revalidatePath(`/dossiers/${personId}/comptes-de-gestion`);
  redirect(`/dossiers/${personId}/comptes-de-gestion/${report.id}`);
}
export async function updateManagementReportAction(
  personId: string,
  reportId: string,
  formData: FormData,
) {
  const parsed = managementReportUpdateSchema.safeParse({
    residenceChanged: formData.get("residenceChanged"),
    representativeAddressChanged: formData.get("representativeAddressChanged"),
    realEstateConfirmed: formData.get("realEstateConfirmed"),
    financialInvestmentsConfirmed: formData.get(
      "financialInvestmentsConfirmed",
    ),
    observations: formData.get("observations"),
    signaturePlace: formData.get("signaturePlace"),
  });
  if (!parsed.success) throw new Error("Informations invalides.");
  await updateManagementReport(personId, reportId, {
    residence_changed: parsed.data.residenceChanged,
    representative_address_changed: parsed.data.representativeAddressChanged,
    real_estate_confirmed: parsed.data.realEstateConfirmed,
    financial_investments_confirmed: parsed.data.financialInvestmentsConfirmed,
    observations: parsed.data.observations,
    signature_place: parsed.data.signaturePlace,
  });
  revalidatePath(`/dossiers/${personId}/comptes-de-gestion/${reportId}`);
}

export async function declareManagementReportTransmissionAction(
  personId: string,
  reportId: string,
  previousState: ManagementReportStatusActionState,
  formData: FormData,
): Promise<ManagementReportStatusActionState> {
  void previousState;
  const parsed = managementReportTransmissionSchema.safeParse({
    transmissionDate: formData.get("transmissionDate"),
    transmissionMethod: formData.get("transmissionMethod"),
    recipient: formData.get("recipient"),
    note: formData.get("note"),
  });
  if (!parsed.success)
    return { status: "error", message: "Vérifiez les informations de transmission." };
  try {
    const { supabase } = await getAuthenticatedUser();
    const { error } = await supabase.rpc("declare_management_report_transmission", {
      p_report_id: reportId,
      p_transmission_date: parsed.data.transmissionDate,
      p_transmission_method: parsed.data.transmissionMethod,
      p_recipient: parsed.data.recipient,
      p_note: parsed.data.note,
    });
    if (error) {
      return { status: "error", message: "Impossible d’enregistrer la transmission." };
    }
    revalidatePath(`/dossiers/${personId}/comptes-de-gestion/${reportId}`);
    return { status: "success", message: "La transmission a été enregistrée." };
  } catch {
    return { status: "error", message: "Impossible d’enregistrer la transmission." };
  }
}

async function getManageableSnapshot(personId: string, reportId: string) {
  const snapshot = await getManagementReportSnapshot(personId, reportId);
  if (!snapshot) throw new Error("Compte de gestion introuvable.");
  if (snapshot.person.accessRole === "read_only")
    throw new Error("Vous ne pouvez pas modifier ce compte de gestion.");
  return snapshot;
}

export async function markManagementReportReadyAction(
  personId: string,
  reportId: string,
  previousState: ManagementReportStatusActionState,
): Promise<ManagementReportStatusActionState> {
  void previousState;
  try {
    const snapshot = await getManageableSnapshot(personId, reportId);
    if (snapshot.report.status === "ready")
      return { status: "success", message: "Le compte de gestion est déjà prêt." };
    if (snapshot.report.status !== "draft")
      return { status: "error", message: "Cette transition de statut n’est pas autorisée." };
    if (!snapshot.completeness.complete) {
      revalidatePath(`/dossiers/${personId}/comptes-de-gestion/${reportId}`);
      return {
        status: "error",
        message: "Le compte de gestion n’est plus complet. Vérifiez les informations à compléter.",
      };
    }
    const updated = await updateManagementReportStatus(
      personId,
      reportId,
      "draft",
      "ready",
    );
    if (!updated)
      return { status: "error", message: "Le statut du compte de gestion a changé. Actualisez la page." };
    revalidatePath(`/dossiers/${personId}/comptes-de-gestion/${reportId}`);
    return { status: "success", message: "Le compte de gestion est prêt." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Impossible de marquer le compte de gestion comme prêt.",
    };
  }
}

export async function resumeManagementReportPreparationAction(
  personId: string,
  reportId: string,
  previousState: ManagementReportStatusActionState,
): Promise<ManagementReportStatusActionState> {
  void previousState;
  try {
    const snapshot = await getManageableSnapshot(personId, reportId);
    if (snapshot.report.status === "draft")
      return { status: "success", message: "Le compte de gestion est déjà en préparation." };
    if (snapshot.report.status !== "ready")
      return { status: "error", message: "Cette transition de statut n’est pas autorisée." };
    const updated = await updateManagementReportStatus(
      personId,
      reportId,
      "ready",
      "draft",
    );
    if (!updated)
      return { status: "error", message: "Le statut du compte de gestion a changé. Actualisez la page." };
    revalidatePath(`/dossiers/${personId}/comptes-de-gestion/${reportId}`);
    return { status: "success", message: "Le compte de gestion est de nouveau en préparation." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Impossible de reprendre la préparation.",
    };
  }
}
