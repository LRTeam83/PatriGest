import type { ManagementPeriod, ProtectedPerson, ProtectionMeasure } from "@/types/database";
import type { ProtectedPersonInput } from "../schemas/protected-person-schema";
import type { ManagementPeriodInput } from "../schemas/management-period-schema";
import type { ProtectionMeasureInput } from "../schemas/protection-measure-schema";
import { getAuthenticatedUser } from "./authenticated-user";

export type ProtectedPersonDetail = ProtectedPerson & {
  protectionMeasures: ProtectionMeasure[];
  managementPeriods: ManagementPeriod[];
};

export async function getProtectedPersons() {
  const { supabase, userId } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("protected_persons")
    .select("*")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error("Impossible de charger les dossiers.");
  return data;
}

export async function getProtectedPerson(id: string): Promise<ProtectedPersonDetail | null> {
  const { supabase, userId } = await getAuthenticatedUser();
  const { data: person, error } = await supabase
    .from("protected_persons")
    .select("*")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) throw new Error("Impossible de charger le dossier.");
  if (!person) return null;

  const [measuresResult, periodsResult] = await Promise.all([
    supabase.from("protection_measures").select("*").eq("protected_person_id", id).order("created_at", { ascending: false }),
    supabase.from("management_periods").select("*").eq("protected_person_id", id).order("start_date", { ascending: false }),
  ]);

  if (measuresResult.error || periodsResult.error) throw new Error("Impossible de charger les informations du dossier.");

  return { ...person, protectionMeasures: measuresResult.data, managementPeriods: periodsResult.data };
}

export async function createProtectedPerson(input: ProtectedPersonInput) {
  const { supabase, userId } = await getAuthenticatedUser();
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
  const { supabase, userId } = await getAuthenticatedUser();
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
    .eq("owner_id", userId)
    .select("*")
    .single();

  if (error) throw new Error("Impossible de modifier le dossier.");
  return data;
}

export async function createProtectionMeasure(protectedPersonId: string, input: ProtectionMeasureInput) {
  const { supabase, userId } = await getAuthenticatedUser();
  const { data: person } = await supabase.from("protected_persons").select("id").eq("id", protectedPersonId).eq("owner_id", userId).maybeSingle();
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
  const { supabase, userId } = await getAuthenticatedUser();
  const { data: person } = await supabase.from("protected_persons").select("id").eq("id", protectedPersonId).eq("owner_id", userId).maybeSingle();
  if (!person) throw new Error("Dossier introuvable.");

  const { data, error } = await supabase.from("management_periods").insert({
    protected_person_id: protectedPersonId,
    start_date: input.startDate,
    end_date: input.endDate,
  }).select("*").single();

  if (error) throw new Error("Impossible de créer l’exercice.");
  return data;
}
