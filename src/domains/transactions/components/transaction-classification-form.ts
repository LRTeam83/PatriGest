import type { Category } from "@/types/database";

export function getEffectiveOfficialCategory(
  categories: readonly Category[],
  categoryId: string,
  fallbackOfficialCategoryId?: string | null,
) {
  const selectedCategory = categories.find((category) => category.id === categoryId);
  if (!selectedCategory) {
    return categories.find((category) => category.id === fallbackOfficialCategoryId) ?? null;
  }
  if (selectedCategory.is_system) return selectedCategory;
  return categories.find((category) => category.id === selectedCategory.official_category_id) ?? null;
}

export function getPrecisionAfterCategoryChange(categories: readonly Category[], categoryId: string) {
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const officialCategory = getEffectiveOfficialCategory(categories, categoryId);
  return selectedCategory && !selectedCategory.is_system && officialCategory?.requires_precision
    ? selectedCategory.name
    : "";
}
