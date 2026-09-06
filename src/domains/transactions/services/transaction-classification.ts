import type { SupabaseClient } from "@supabase/supabase-js";

import type { Category, Database, Transaction } from "@/types/database";

type OrdinaryTransactionType = Extract<Transaction["transaction_type"], "income" | "expense">;
type ClassificationClient = Pick<SupabaseClient<Database>, "from">;

export type StableTransactionClassification = {
  categoryId: string | null;
  officialCategoryId: string | null;
  classificationPrecision: string | null;
  accountingNature: "ordinary";
};

export type ExistingTransactionClassification = Pick<
  Transaction,
  "accounting_nature" | "category_id" | "official_category_id" | "classification_precision"
>;

type ResolveTransactionClassificationInput = {
  supabase: ClassificationClient;
  userId: string;
  transactionType: OrdinaryTransactionType;
  categoryId: string | null;
  classificationPrecision?: string | null;
};

type ResolveTransactionClassificationUpdateInput = Omit<
  ResolveTransactionClassificationInput,
  "categoryId"
> & {
  existing: ExistingTransactionClassification;
  categoryId?: string | null;
};

const INCOMPATIBLE_CATEGORY_ERROR = "Catégorie incompatible.";
const INVALID_PRECISION_ERROR = "La précision de classification ne peut pas dépasser 160 caractères.";
const CAPITAL_MOVEMENT_UPDATE_ERROR = "Un mouvement de capital ne peut pas être modifié comme une opération ordinaire.";

export function normalizeClassificationPrecision(value: string | null | undefined) {
  const normalized = value?.trim() || null;
  if (normalized && [...normalized].length > 160) throw new Error(INVALID_PRECISION_ERROR);
  return normalized;
}

function isUsageCompatible(category: Category, transactionType: OrdinaryTransactionType) {
  return category.usage === transactionType || category.usage === "both";
}

function isOfficialUsageCompatible(category: Category, transactionType: OrdinaryTransactionType) {
  return category.usage === transactionType;
}

function isOfficialTerminalCategory(category: Category) {
  return category.is_system
    && category.owner_id === null
    && category.official_code !== null
    && category.official_category_id === null;
}

async function getCategory(supabase: ClassificationClient, categoryId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .maybeSingle();

  if (error || !data) throw new Error(INCOMPATIBLE_CATEGORY_ERROR);
  return data;
}

function classificationForOfficialCategory(
  categoryId: string | null,
  officialCategory: Category,
  classificationPrecision: string | null | undefined,
): StableTransactionClassification {
  const normalizedPrecision = normalizeClassificationPrecision(classificationPrecision);
  return {
    categoryId,
    officialCategoryId: officialCategory.id,
    classificationPrecision: officialCategory.requires_precision ? normalizedPrecision : null,
    accountingNature: "ordinary",
  };
}

export async function resolveTransactionClassification({
  supabase,
  userId,
  transactionType,
  categoryId,
  classificationPrecision,
}: ResolveTransactionClassificationInput): Promise<StableTransactionClassification> {
  if (!categoryId) {
    normalizeClassificationPrecision(classificationPrecision);
    return {
      categoryId: null,
      officialCategoryId: null,
      classificationPrecision: null,
      accountingNature: "ordinary",
    };
  }

  const selectedCategory = await getCategory(supabase, categoryId);
  if (!selectedCategory.active || !isUsageCompatible(selectedCategory, transactionType)) {
    throw new Error(INCOMPATIBLE_CATEGORY_ERROR);
  }

  if (selectedCategory.is_system) {
    if (
      !isOfficialTerminalCategory(selectedCategory)
      || !isOfficialUsageCompatible(selectedCategory, transactionType)
    ) {
      throw new Error(INCOMPATIBLE_CATEGORY_ERROR);
    }
    return classificationForOfficialCategory(categoryId, selectedCategory, classificationPrecision);
  }

  if (selectedCategory.owner_id !== userId || !selectedCategory.official_category_id) {
    throw new Error(INCOMPATIBLE_CATEGORY_ERROR);
  }

  const officialCategory = await getCategory(supabase, selectedCategory.official_category_id);
  if (
    !officialCategory.active
    || !isOfficialTerminalCategory(officialCategory)
    || !isOfficialUsageCompatible(officialCategory, transactionType)
  ) {
    throw new Error(INCOMPATIBLE_CATEGORY_ERROR);
  }

  return classificationForOfficialCategory(categoryId, officialCategory, classificationPrecision);
}

export async function resolveTransactionClassificationForUpdate({
  supabase,
  userId,
  transactionType,
  existing,
  categoryId,
  classificationPrecision,
}: ResolveTransactionClassificationUpdateInput): Promise<StableTransactionClassification> {
  if (existing.accounting_nature === "capital_movement") {
    throw new Error(CAPITAL_MOVEMENT_UPDATE_ERROR);
  }

  const categoryChanged = categoryId !== undefined && categoryId !== existing.category_id;
  if (categoryChanged) {
    return resolveTransactionClassification({
      supabase,
      userId,
      transactionType,
      categoryId,
      classificationPrecision,
    });
  }

  const alreadyStable = existing.accounting_nature === "ordinary"
    || existing.official_category_id !== null;

  if (!alreadyStable) {
    return resolveTransactionClassification({
      supabase,
      userId,
      transactionType,
      categoryId: existing.category_id,
      classificationPrecision,
    });
  }

  if (classificationPrecision === undefined) {
    return {
      categoryId: existing.category_id,
      officialCategoryId: existing.official_category_id,
      classificationPrecision: existing.classification_precision,
      accountingNature: "ordinary",
    };
  }

  if (!existing.official_category_id) {
    normalizeClassificationPrecision(classificationPrecision);
    return {
      categoryId: existing.category_id,
      officialCategoryId: null,
      classificationPrecision: null,
      accountingNature: "ordinary",
    };
  }

  const officialCategory = await getCategory(supabase, existing.official_category_id);
  if (
    !isOfficialTerminalCategory(officialCategory)
    || !isOfficialUsageCompatible(officialCategory, transactionType)
  ) {
    throw new Error(INCOMPATIBLE_CATEGORY_ERROR);
  }

  return classificationForOfficialCategory(
    existing.category_id,
    officialCategory,
    classificationPrecision,
  );
}
