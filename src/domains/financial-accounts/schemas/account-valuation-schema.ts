import { z } from "zod";

export const accountValuationSchema = z.object({
  valuationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Saisissez une date valide."),
  value: z.string().trim().min(1, "Saisissez une valeur.").refine((value) => /^\d+(?:[.,]\d{1,2})?$/.test(value), "Saisissez une valeur positive avec deux décimales maximum.").transform((value) => Number(value.replace(",", "."))),
  comment: z.string().trim().max(1000).optional().transform((value) => value || null),
});

export type AccountValuationInput = z.infer<typeof accountValuationSchema>;
