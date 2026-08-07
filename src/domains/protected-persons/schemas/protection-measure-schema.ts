import { z } from "zod";

export const measureTypes = [
  { value: "safeguard_of_justice", label: "Sauvegarde de justice" },
  { value: "simple_curatorship", label: "Curatelle simple" },
  { value: "reinforced_curatorship", label: "Curatelle renforcée" },
  { value: "guardianship", label: "Tutelle" },
  { value: "future_protection_mandate", label: "Mandat de protection future" },
  { value: "family_authorization", label: "Habilitation familiale" },
] as const;

const measureTypeValues = measureTypes.map((item) => item.value) as [
  (typeof measureTypes)[number]["value"],
  ...(typeof measureTypes)[number]["value"][],
];

export const protectionMeasureSchema = z.object({
  measureType: z.enum(measureTypeValues, "Choisissez une mesure de protection."),
  startDate: z.string().optional().transform((value) => value || null),
  decisionDate: z.string().optional().transform((value) => value || null),
});

export type ProtectionMeasureInput = z.infer<typeof protectionMeasureSchema>;

export function getMeasureLabel(value: string) {
  return measureTypes.find((item) => item.value === value)?.label ?? value;
}
