import type { Category, Transaction } from "@/types/database";

type TransactionClassificationFields = Pick<
  Transaction,
  | "transaction_type"
  | "transfer_id"
  | "accounting_nature"
  | "category_id"
  | "official_category_id"
  | "classification_precision"
>;

export type EffectiveTransactionClassification =
  | { state: "transfer" }
  | { state: "capital_movement" }
  | { state: "unclassified" }
  | {
      state: "needs_precision";
      officialCategory: Category;
      source: "stable" | "legacy";
    }
  | {
      state: "classified";
      officialCategory: Category;
      precision: string | null;
      source: "stable" | "legacy";
    };

type ResolveEffectiveTransactionClassificationInput = {
  transaction: TransactionClassificationFields;
  stableOfficialCategory: Category | null;
  legacyCategory: Category | null;
  legacyOfficialCategory: Category | null;
};

function isOfficialCategory(category: Category | null) {
  return Boolean(
    category
      && category.is_system
      && category.owner_id === null
      && category.official_code !== null
      && category.official_category_id === null,
  );
}

export function resolveEffectiveTransactionClassification({
  transaction,
  stableOfficialCategory,
  legacyCategory,
  legacyOfficialCategory,
}: ResolveEffectiveTransactionClassificationInput): EffectiveTransactionClassification {
  const isTransfer = transaction.transaction_type === "transfer_in"
    || transaction.transaction_type === "transfer_out";
  if (isTransfer && transaction.transfer_id) {
    return { state: "transfer" };
  }

  if (transaction.accounting_nature === "capital_movement") {
    return { state: "capital_movement" };
  }

  if (isTransfer) {
    return { state: "unclassified" };
  }

  let officialCategory: Category | null = null;
  let source: "stable" | "legacy" = "legacy";

  if (
    transaction.official_category_id
    && stableOfficialCategory?.id === transaction.official_category_id
    && isOfficialCategory(stableOfficialCategory)
  ) {
    officialCategory = stableOfficialCategory;
    source = "stable";
  } else if (transaction.category_id && legacyCategory?.id === transaction.category_id) {
    if (isOfficialCategory(legacyCategory)) {
      officialCategory = legacyCategory;
    } else if (
      !legacyCategory.is_system
      && legacyCategory.official_category_id
      && legacyOfficialCategory?.id === legacyCategory.official_category_id
      && isOfficialCategory(legacyOfficialCategory)
    ) {
      officialCategory = legacyOfficialCategory;
    }
  }

  if (!officialCategory) return { state: "unclassified" };
  if (officialCategory.requires_precision && transaction.classification_precision === null) {
    return { state: "needs_precision", officialCategory, source };
  }
  return {
    state: "classified",
    officialCategory,
    precision: officialCategory.requires_precision ? transaction.classification_precision : null,
    source,
  };
}
