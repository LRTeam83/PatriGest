import { z } from "zod";

export const managementPeriodSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Saisissez une date de début valide."),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Saisissez une date de fin valide."),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["endDate"],
  });

export type ManagementPeriodInput = z.infer<typeof managementPeriodSchema>;
