import { getPrivateAccessContext } from "@/domains/administration/services/private-access-context";
import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";
import type { CategoryInput } from "../schemas/category-schema";

async function ensureBusinessUser() {
  const { isPlatformAdmin } = await getPrivateAccessContext();
  if (isPlatformAdmin) throw new Error("Un administrateur de plateforme ne peut pas gérer les catégories métier.");
}

export async function getCategories(includeArchived = true) {
  const { supabase } = await getAuthenticatedUser();
  let query = supabase.from("categories").select("*").order("is_system", { ascending: false }).order("usage").order("official_order").order("name");
  if (!includeArchived) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error("Impossible de charger les catégories.");
  return data;
}

async function getOfficialCategory(input: CategoryInput) {
  const { supabase } = await getAuthenticatedUser();
  const { data } = await supabase.from("categories").select("id,usage").eq("id", input.officialCategoryId).eq("usage", input.usage).eq("is_system", true).not("official_code", "is", null).eq("active", true).maybeSingle();
  if (!data) throw new Error("Rubrique officielle invalide.");
  return data;
}

export async function createCategory(input: CategoryInput) {
  await ensureBusinessUser();
  const [{ supabase, userId }, official] = await Promise.all([getAuthenticatedUser(), getOfficialCategory(input)]);
  const { error } = await supabase.from("categories").insert({ owner_id: userId, name: input.name, usage: input.usage, official_category_id: official.id });
  if (error) throw new Error("Impossible de créer la catégorie.");
}

export async function updateCategory(id: string, input: CategoryInput) {
  await ensureBusinessUser();
  const [{ supabase, userId }, official] = await Promise.all([getAuthenticatedUser(), getOfficialCategory(input)]);
  const { data, error } = await supabase.from("categories").update({ name: input.name, usage: input.usage, official_category_id: official.id }).eq("id", id).eq("owner_id", userId).eq("is_system", false).select("id").maybeSingle();
  if (error || !data) throw new Error("Catégorie introuvable.");
}

export async function archiveCategory(id: string) {
  await ensureBusinessUser();
  const { supabase, userId } = await getAuthenticatedUser();
  const { data, error } = await supabase.from("categories").update({ active: false }).eq("id", id).eq("owner_id", userId).eq("is_system", false).select("id").maybeSingle();
  if (error || !data) throw new Error("Catégorie introuvable.");
}

export async function reactivateCategory(id: string) {
  await ensureBusinessUser();
  const { supabase, userId } = await getAuthenticatedUser();
  const { data, error } = await supabase.from("categories").update({ active: true }).eq("id", id).eq("owner_id", userId).eq("is_system", false).select("id").maybeSingle();
  if (error || !data) throw new Error("Catégorie introuvable.");
}
