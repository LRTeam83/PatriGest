import type { DossierAccessRole, ManagementPeriod, ProtectedPerson, ProtectionMeasure } from "@/types/database";
import type { ProtectedPersonInput } from "../schemas/protected-person-schema";
import type { ManagementPeriodInput } from "../schemas/management-period-schema";
import type { ProtectionMeasureInput } from "../schemas/protection-measure-schema";
import { getAuthenticatedUser } from "./authenticated-user";

export type ProtectedPersonDetail = ProtectedPerson & {
  protectionMeasures: ProtectionMeasure[];
  managementPeriods: ManagementPeriod[];
  accessRole: DossierAccessRole;
};
export type ProtectedPersonListItem = ProtectedPerson & { accessRole: DossierAccessRole };

export async function getProtectedPersons() {
  const { supabase, userId } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("protected_persons")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Impossible de charger les dossiers.");
  const { data: sharedAccess, error: accessError } = await supabase.from("protected_person_access").select("protected_person_id,role").eq("user_id", userId);
  if (accessError) throw new Error("Impossible de charger les droits des dossiers.");
  const roles = new Map(sharedAccess.map((access) => [access.protected_person_id, access.role]));
  return data.map((person) => ({ ...person, accessRole: person.owner_id === userId ? "owner" as const : roles.get(person.id) ?? "read_only" as const }));
}

export async function getProtectedPerson(id: string): Promise<ProtectedPersonDetail | null> {
  const { supabase, userId } = await getAuthenticatedUser();
  const { data: person, error } = await supabase
    .from("protected_persons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Impossible de charger le dossier.");
  if (!person) return null;

  const [measuresResult, periodsResult] = await Promise.all([
    supabase.from("protection_measures").select("*").eq("protected_person_id", id).order("created_at", { ascending: false }),
    supabase.from("management_periods").select("*").eq("protected_person_id", id).order("start_date", { ascending: false }),
  ]);

  if (measuresResult.error || periodsResult.error) throw new Error("Impossible de charger les informations du dossier.");

  const { data: access } = person.owner_id === userId ? { data: null } : await supabase.from("protected_person_access").select("role").eq("protected_person_id", id).eq("user_id", userId).maybeSingle();
  return { ...person, protectionMeasures: measuresResult.data, managementPeriods: periodsResult.data, accessRole: person.owner_id === userId ? "owner" : access?.role ?? "read_only" };
}

export async function createProtectedPerson(input: ProtectedPersonInput) {
  const { supabase, userId } = await getAuthenticatedUser();
  const { data: administrator } = await supabase.from("platform_administrators").select("user_id").eq("user_id", userId).maybeSingle();
  if (administrator) throw new Error("Un administrateur de plateforme ne peut pas créer de dossier.");
  const { data, error } = await supabase
    .from("protected_persons")
    .insert({
      owner_id: userId,
      first_name: input.firstName,
      last_name: input.lastName,
      birth_name: input.birthName,
      birth_date: input.birthDate,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      postal_code: input.postalCode,
      city: input.city,
    })
    .select("*")
    .single();

  if (error) throw new Error("Impossible de créer le dossier.");
  return data;
}

export async function updateProtectedPerson(id: string, input: ProtectedPersonInput) {
  const { supabase } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("protected_persons")
    .update({
      first_name: input.firstName,
      last_name: input.lastName,
      birth_name: input.birthName,
      birth_date: input.birthDate,
      address_line1: input.addressLine1,
      address_line2: input.addressLine2,
      postal_code: input.postalCode,
      city: input.city,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error("Impossible de modifier le dossier.");
  return data;
}

export async function createProtectionMeasure(protectedPersonId: string, input: ProtectionMeasureInput) {
  const { supabase } = await getAuthenticatedUser();
  const { data: person } = await supabase.from("protected_persons").select("id").eq("id", protectedPersonId).maybeSingle();
  if (!person) throw new Error("Dossier introuvable.");

  const { data, error } = await supabase.from("protection_measures").insert({
    protected_person_id: protectedPersonId,
    measure_type: input.measureType,
    start_date: input.startDate,
    decision_date: input.decisionDate,
    active: true,
  }).select("*").single();

  if (error) throw new Error("Impossible d’ajouter la mesure.");
  return data;
}

export async function createManagementPeriod(protectedPersonId: string, input: ManagementPeriodInput) {
  const { supabase } = await getAuthenticatedUser();
  const { data: person } = await supabase.from("protected_persons").select("id").eq("id", protectedPersonId).maybeSingle();
  if (!person) throw new Error("Dossier introuvable.");

  const { data, error } = await supabase.from("management_periods").insert({
    protected_person_id: protectedPersonId,
    start_date: input.startDate,
    end_date: input.endDate,
  }).select("*").single();

  if (error) throw new Error("Impossible de créer l’exercice.");
  return data;
}

export async function updateManagementPeriod(protectedPersonId: string, periodId: string, input: ManagementPeriodInput) {
  const { supabase } = await getAuthenticatedUser();
  const { data: person } = await supabase.from("protected_persons").select("id").eq("id", protectedPersonId).maybeSingle();
  if (!person) throw new Error("Dossier introuvable.");
  const { data, error } = await supabase.from("management_periods").update({ start_date: input.startDate, end_date: input.endDate }).eq("id", periodId).eq("protected_person_id", protectedPersonId).eq("status", "open").select("*").maybeSingle();
  if (error || !data) throw new Error("Exercice ouvert introuvable.");
  return data;
}

export async function closeManagementPeriod(protectedPersonId: string, periodId: string) {
  const { supabase } = await getAuthenticatedUser();
  const { data: person } = await supabase.from("protected_persons").select("id").eq("id", protectedPersonId).maybeSingle();
  if (!person) throw new Error("Dossier introuvable.");
  const { data, error } = await supabase.from("management_periods").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", periodId).eq("protected_person_id", protectedPersonId).eq("status", "open").select("id").maybeSingle();
  if (error || !data) throw new Error("Exercice ouvert introuvable.");
}

export async function reopenManagementPeriod(protectedPersonId: string, periodId: string) {
  const { supabase } = await getAuthenticatedUser();
  const { data: person } = await supabase.from("protected_persons").select("id").eq("id", protectedPersonId).maybeSingle();
  if (!person) throw new Error("Dossier introuvable.");

  const { data: period, error: periodError } = await supabase.from("management_periods").select("id").eq("id", periodId).eq("protected_person_id", protectedPersonId).eq("status", "closed").maybeSingle();
  if (periodError || !period) throw new Error("Exercice clôturé introuvable.");

  const { data, error } = await supabase.from("management_periods").update({ status: "open", closed_at: null }).eq("id", periodId).eq("protected_person_id", protectedPersonId).eq("status", "closed").select("id").maybeSingle();
  if (error || !data) throw new Error("Impossible de réouvrir cet exercice.");
}
