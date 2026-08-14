import { z } from "zod";

const optionalText = (maximum: number) => z.preprocess(
  (value) => value === null ? undefined : value,
  z.string().trim().max(maximum, `Ce champ ne peut pas dépasser ${maximum} caractères.`).optional().transform((value) => value || null),
);
const optionalDate = z.preprocess((value) => value === null ? undefined : value, z.string().optional().transform((value) => value || null)).refine(
  (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
  "Saisissez une date valide.",
);
const optionalEmail = z.preprocess((value) => value === null ? undefined : value, z.union([z.literal(""), z.email("Saisissez une adresse email valide.").trim().toLowerCase()]).optional().transform((value) => value || null));

export const protectedPersonSchema = z.object({
  firstName: z.string().trim().min(1, "Saisissez le prénom.").max(100),
  lastName: z.string().trim().min(1, "Saisissez le nom d’usage.").max(100),
  birthName: optionalText(100),
  birthDate: optionalDate,
  birthPlace: optionalText(150),
  addressLine1: optionalText(200),
  addressLine2: optionalText(200),
  postalCode: optionalText(20),
  city: optionalText(100),
  country: optionalText(100),
  phone: optionalText(50),
  email: optionalEmail,
  residenceAddressLine1: optionalText(200),
  residenceAddressLine2: optionalText(200),
  residencePostalCode: optionalText(20),
  residenceCity: optionalText(100),
  residenceCountry: optionalText(100),
}).superRefine((data, context) => {
  const hasResidence = [data.residenceAddressLine2, data.residencePostalCode, data.residenceCity, data.residenceCountry].some(Boolean);
  if (hasResidence && !data.residenceAddressLine1) context.addIssue({ code: "custom", path: ["residenceAddressLine1"], message: "Saisissez l’adresse de résidence." });
});

export type ProtectedPersonInput = z.infer<typeof protectedPersonSchema>;
