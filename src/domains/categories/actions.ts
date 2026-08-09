"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { categorySchema } from "./schemas/category-schema";
import { archiveCategory, createCategory, reactivateCategory, updateCategory } from "./services/category-service";
import type { CategoryActionState } from "./state";
const values = (formData: FormData) => ({ name: formData.get("name"), usage: formData.get("usage") });
export async function createCategoryAction(_: CategoryActionState, formData: FormData): Promise<CategoryActionState> { const parsed = categorySchema.safeParse(values(formData)); if (!parsed.success) return { status: "error", message: "Vérifiez les informations saisies.", fieldErrors: parsed.error.flatten().fieldErrors }; try { await createCategory(parsed.data); revalidatePath("/parametres/categories"); return { status: "success", message: "La catégorie a été créée." }; } catch { return { status: "error", message: "Impossible de créer la catégorie. Ce nom est peut-être déjà utilisé." }; } }
export async function updateCategoryAction(id: string, _: CategoryActionState, formData: FormData): Promise<CategoryActionState> { if (!z.uuid().safeParse(id).success) return { status: "error", message: "Catégorie invalide." }; const parsed = categorySchema.safeParse(values(formData)); if (!parsed.success) return { status: "error", message: "Vérifiez les informations saisies.", fieldErrors: parsed.error.flatten().fieldErrors }; try { await updateCategory(id, parsed.data); revalidatePath("/parametres/categories"); return { status: "success", message: "La catégorie a été modifiée." }; } catch { return { status: "error", message: "Impossible de modifier la catégorie." }; } }
export async function archiveCategoryAction(id: string) { if (!z.uuid().safeParse(id).success) return; await archiveCategory(id); revalidatePath("/parametres/categories"); }
export async function reactivateCategoryAction(id: string) { if (!z.uuid().safeParse(id).success) return; await reactivateCategory(id); revalidatePath("/parametres/categories"); }
