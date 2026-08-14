import type { MeasureType, ProtectedPerson, ProtectionMeasure } from "@/types/database";

export type RegulatoryMissingField = { field: string; label: string };
export type RegulatoryCompleteness = { complete: boolean; missingFields: RegulatoryMissingField[] };

const present = (value: string | null | undefined) => Boolean(value?.trim());

type ProtectedPersonRegulatoryData = Pick<ProtectedPerson, "birth_name" | "last_name" | "first_name" | "birth_date" | "birth_place" | "address_line1" | "postal_code" | "city" | "phone" | "email">;
type ProtectionMeasureRegulatoryData = Pick<ProtectionMeasure, "measure_type" | "start_date" | "case_reference" | "court_cabinet" | "representative_first_name" | "representative_last_name" | "representative_appointment_date" | "representative_address_line1" | "representative_postal_code" | "representative_city" | "representative_phone" | "representative_email">;

export function getProtectedPersonRegulatoryCompleteness(person: ProtectedPersonRegulatoryData): RegulatoryCompleteness {
  const missingFields = [
    { field: "birth_name", label: "Nom de naissance", value: person.birth_name }, { field: "last_name", label: "Nom d’usage", value: person.last_name }, { field: "first_name", label: "Prénom(s)", value: person.first_name },
    { field: "birth_date", label: "Date de naissance", value: person.birth_date }, { field: "birth_place", label: "Lieu de naissance", value: person.birth_place }, { field: "address_line1", label: "Domicile", value: person.address_line1 },
    { field: "postal_code", label: "Code postal du domicile", value: person.postal_code }, { field: "city", label: "Commune du domicile", value: person.city }, { field: "phone", label: "Téléphone", value: person.phone }, { field: "email", label: "Email", value: person.email },
  ].filter((entry) => !present(entry.value)).map(({ field, label }) => ({ field, label }));
  return { complete: missingFields.length === 0, missingFields };
}

export function getProtectionMeasureRegulatoryCompleteness(measure: ProtectionMeasureRegulatoryData | null): RegulatoryCompleteness {
  if (!measure) return { complete: false, missingFields: [{ field: "measure", label: "Mesure de protection" }] };
  const requiredFields = [
    { field: "start_date", label: "Date d’ouverture ou de renouvellement", value: measure.start_date }, { field: "measure_type", label: "Type de mesure", value: measure.measure_type },
    { field: "representative_first_name", label: "Prénom de la personne en charge", value: measure.representative_first_name }, { field: "representative_last_name", label: "Nom de la personne en charge", value: measure.representative_last_name },
    { field: "representative_appointment_date", label: "Date de nomination", value: measure.representative_appointment_date }, { field: "representative_address_line1", label: "Adresse de la personne en charge", value: measure.representative_address_line1 },
    { field: "representative_postal_code", label: "Code postal de la personne en charge", value: measure.representative_postal_code }, { field: "representative_city", label: "Commune de la personne en charge", value: measure.representative_city },
    { field: "representative_phone", label: "Téléphone de la personne en charge", value: measure.representative_phone }, { field: "representative_email", label: "Email de la personne en charge", value: measure.representative_email },
  ];
  if (measure.measure_type !== "future_protection_mandate") requiredFields.push(
    { field: "case_reference", label: "Numéro RG", value: measure.case_reference }, { field: "court_cabinet", label: "Cabinet", value: measure.court_cabinet },
  );
  const missingFields = requiredFields.filter((entry) => !present(entry.value)).map(({ field, label }) => ({ field, label }));
  return { complete: missingFields.length === 0, missingFields };
}

const officialMeasureTypes: Partial<Record<MeasureType, string>> = {
  guardianship: "Tutelle",
  reinforced_curatorship: "Curatelle renforcée",
  safeguard_with_special_mandate: "Sauvegarde de justice avec mandat spécial",
  future_protection_mandate: "Mandat de protection future",
  judicial_support_measure: "Mesure d’accompagnement judiciaire",
};

export function getOfficialMeasureCorrespondence(measureType: MeasureType): { direct: true; officialLabel: string } | { direct: false; officialLabel: null } {
  const officialLabel = officialMeasureTypes[measureType];
  return officialLabel ? { direct: true, officialLabel } : { direct: false, officialLabel: null };
}
