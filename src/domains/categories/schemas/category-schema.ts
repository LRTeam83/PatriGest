import { z } from "zod";
export const categorySchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  usage: z.enum(["income", "expense"]),
  officialCategoryId: z.uuid("Choisissez une rubrique officielle."),
});
export type CategoryInput = z.infer<typeof categorySchema>;
