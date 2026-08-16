import { z } from "zod";
const optionalBoolean = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : null),
  z.boolean().nullable(),
);
export const managementReportCreateSchema = z
  .object({
    managementPeriodId: z
      .union([z.uuid(), z.literal("")])
      .transform((value) => value || null),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    reportYear: z.coerce.number().int().min(1900).max(2200),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    message: "La période est invalide.",
    path: ["periodEnd"],
  });
export const managementReportUpdateSchema = z.object({
  residenceChanged: optionalBoolean,
  representativeAddressChanged: optionalBoolean,
  realEstateConfirmed: optionalBoolean,
  financialInvestmentsConfirmed: optionalBoolean,
  observations: z
    .string()
    .trim()
    .max(10000)
    .transform((value) => value || null),
  signaturePlace: z
    .string()
    .trim()
    .max(255)
    .transform((value) => value || null),
});
