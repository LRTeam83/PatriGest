import { z } from "zod";
const optionalText = z.string().trim().max(500).transform((v) => v || null);
export const transferSchema = z.object({ sourceAccountId: z.uuid(), destinationAccountId: z.uuid(), transferDate: z.iso.date(), amount: z.coerce.number().positive("Le montant doit être strictement positif."), label: optionalText, comment: optionalText }).refine((v) => v.sourceAccountId !== v.destinationAccountId, { path: ["destinationAccountId"], message: "Choisissez un compte différent." });
export type TransferInput = z.infer<typeof transferSchema>;
