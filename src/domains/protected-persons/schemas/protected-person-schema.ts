import { z } from "zod";

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum, `Ce champ ne peut pas dépasser ${maximum} caractères.`).optional().transform((value) => value || null);

export const protectedPersonSchema = z.object({
  firstName: z.string().trim().min(1, "Saisissez le prénom.").max(100),
  lastName: z.string().trim().min(1, "Saisissez le nom.").max(100),
  birthName: optionalText(100),
  birthDate: z.string().optional().transform((value) => value || null).refine(
    (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "Saisissez une date valide.",
  ),
  addressLine1: optionalText(200),
  addressLine2: optionalText(200),
  postalCode: optionalText(20),
  city: optionalText(100),
});

export type ProtectedPersonInput = z.infer<typeof protectedPersonSchema>;
