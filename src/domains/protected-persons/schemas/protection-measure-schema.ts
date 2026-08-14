import { z } from "zod";
import type { MeasureType } from "@/types/database";

export const measureTypes = [
  { value: "safeguard_of_justice", label: "Sauvegarde de justice" },
  { value: "safeguard_with_special_mandate", label: "Sauvegarde de justice avec mandat spécial" },
  { value: "simple_curatorship", label: "Curatelle simple" },
  { value: "reinforced_curatorship", label: "Curatelle renforcée" },
  { value: "guardianship", label: "Tutelle" },
  { value: "future_protection_mandate", label: "Mandat de protection future" },
  { value: "family_authorization", label: "Habilitation familiale" },
  { value: "judicial_support_measure", label: "Mesure d’accompagnement judiciaire" },
] as const satisfies readonly { value: MeasureType; label: string }[];

const measureTypeValues = measureTypes.map((item) => item.value) as [MeasureType, ...MeasureType[]];
const optionalText = (maximum: number) => z.preprocess((value) => value === null ? undefined : value, z.string().trim().max(maximum).optional().transform((value) => value || null));
const optionalDate = z.preprocess((value) => value === null ? undefined : value, z.string().optional().transform((value) => value || null)).refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), "Saisissez une date valide.");
const optionalEmail = z.preprocess((value) => value === null ? undefined : value, z.union([z.literal(""), z.email("Saisissez une adresse email valide.").trim().toLowerCase()]).optional().transform((value) => value || null));

export const protectionMeasureSchema = z.object({
  measureType: z.enum(measureTypeValues, "Choisissez une mesure de protection."),
  startDate: optionalDate,
  decisionDate: optionalDate,
  caseReference: optionalText(100),
  courtCabinet: optionalText(150),
  courtName: optionalText(200),
  courtCity: optionalText(100),
  representativeFirstName: optionalText(100),
  representativeLastName: optionalText(100),
  representativeAppointmentDate: optionalDate,
  representativeAddressLine1: optionalText(200),
  representativeAddressLine2: optionalText(200),
  representativePostalCode: optionalText(20),
  representativeCity: optionalText(100),
  representativeCountry: optionalText(100),
  representativePhone: optionalText(50),
  representativeEmail: optionalEmail,
}).superRefine((data, context) => {
  const hasRepresentativeDetails = [data.representativeLastName, data.representativeAppointmentDate, data.representativeAddressLine1, data.representativeAddressLine2, data.representativePostalCode, data.representativeCity, data.representativeCountry, data.representativePhone, data.representativeEmail].some(Boolean);
  if (hasRepresentativeDetails && !data.representativeFirstName) context.addIssue({ code: "custom", path: ["representativeFirstName"], message: "Saisissez le prénom de la personne en charge." });
});

export type ProtectionMeasureInput = z.infer<typeof protectionMeasureSchema>;

export function getMeasureLabel(value: string) {
  return measureTypes.find((item) => item.value === value)?.label ?? value;
}
