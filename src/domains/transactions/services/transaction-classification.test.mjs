import assert from "node:assert/strict";
import test from "node:test";

import {
  ClassificationPrecisionRequiredError,
  normalizeClassificationPrecision,
  resolveTransactionClassification,
  resolveTransactionClassificationForUpdate,
} from "./transaction-classification.ts";
import { getEffectiveOfficialCategory, getPrecisionAfterCategoryChange } from "../components/transaction-classification-form.ts";

const userId = "11111111-1111-4111-8111-111111111111";

function category(overrides = {}) {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    owner_id: null,
    name: "Catégorie officielle",
    usage: "expense",
    is_system: true,
    active: true,
    official_code: "DEP-1-08",
    official_section: "Dépenses",
    official_group: "Vie quotidienne",
    official_order: 1,
    official_category_id: null,
    requires_precision: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function client(categories, readIds = []) {
  return {
    from(table) {
      assert.equal(table, "categories");
      return {
        select() {
          let selectedId;
          return {
            eq(column, value) {
              assert.equal(column, "id");
              selectedId = value;
              return this;
            },
            async maybeSingle() {
              readIds.push(selectedId);
              return { data: categories.find((entry) => entry.id === selectedId) ?? null, error: null };
            },
          };
        },
      };
    },
  };
}

test("normalise la précision", () => {
  assert.equal(normalizeClassificationPrecision("  Loyer résidence  "), "Loyer résidence");
  assert.equal(normalizeClassificationPrecision("   "), null);
  assert.equal(normalizeClassificationPrecision("é".repeat(160)), "é".repeat(160));
  assert.equal(normalizeClassificationPrecision("😀".repeat(160)), "😀".repeat(160));
  assert.throws(() => normalizeClassificationPrecision("é".repeat(161)), /160 caractères/);
  assert.throws(() => normalizeClassificationPrecision("😀".repeat(161)), /160 caractères/);
});

test("résout une catégorie système sans précision", async () => {
  const official = category();
  assert.deepEqual(await resolveTransactionClassification({ supabase: client([official]), userId, transactionType: "expense", categoryId: official.id, classificationPrecision: "parasite" }), {
    categoryId: official.id,
    officialCategoryId: official.id,
    classificationPrecision: null,
    accountingNature: "ordinary",
  });
});

test("conserve la précision d'une catégorie système qui l'exige", async () => {
  const official = category({ requires_precision: true });
  const result = await resolveTransactionClassification({ supabase: client([official]), userId, transactionType: "expense", categoryId: official.id, classificationPrecision: "  Coiffeur  ", requirePrecision: true });
  assert.equal(result.classificationPrecision, "Coiffeur");
});

test("exige une précision pour une nouvelle catégorie système en mode manuel", async () => {
  const official = category({ requires_precision: true });
  await assert.rejects(resolveTransactionClassification({ supabase: client([official]), userId, transactionType: "expense", categoryId: official.id, classificationPrecision: null, requirePrecision: true }), ClassificationPrecisionRequiredError);
  const lowLevel = await resolveTransactionClassification({ supabase: client([official]), userId, transactionType: "expense", categoryId: official.id, classificationPrecision: null });
  assert.equal(lowLevel.classificationPrecision, null);
});

test("résout un preset personnel sans copier automatiquement son nom", async () => {
  const official = category({ requires_precision: true });
  const preset = category({ id: "33333333-3333-4333-8333-333333333333", owner_id: userId, name: "Coiffeur", is_system: false, official_code: null, official_category_id: official.id, requires_precision: false });
  const result = await resolveTransactionClassification({ supabase: client([preset, official]), userId, transactionType: "expense", categoryId: preset.id });
  assert.equal(result.categoryId, preset.id);
  assert.equal(result.officialCategoryId, official.id);
  assert.equal(result.classificationPrecision, null);
});

test("exige une précision pour un nouveau preset en mode manuel", async () => {
  const official = category({ requires_precision: true });
  const preset = category({ id: "99999999-9999-4999-8999-999999999999", owner_id: userId, name: "Coiffeur", is_system: false, official_code: null, official_category_id: official.id });
  await assert.rejects(resolveTransactionClassification({ supabase: client([preset, official]), userId, transactionType: "expense", categoryId: preset.id, classificationPrecision: "", requirePrecision: true }), ClassificationPrecisionRequiredError);
  const result = await resolveTransactionClassification({ supabase: client([preset, official]), userId, transactionType: "expense", categoryId: preset.id, classificationPrecision: "Coiffeur à domicile", requirePrecision: true });
  assert.equal(result.classificationPrecision, "Coiffeur à domicile");
});

test("refuse un preset appartenant à un autre utilisateur", async () => {
  const preset = category({ owner_id: "44444444-4444-4444-8444-444444444444", is_system: false, official_code: null, official_category_id: category().id });
  await assert.rejects(resolveTransactionClassification({ supabase: client([preset]), userId, transactionType: "expense", categoryId: preset.id }), /Catégorie incompatible/);
});

test("refuse une nouvelle sélection inactive ou d'un mauvais usage", async () => {
  const inactive = category({ active: false });
  const income = category({ id: "55555555-5555-4555-8555-555555555555", usage: "income", official_code: "RES-1-06" });
  const preset = category({ id: "66666666-6666-4666-8666-666666666666", owner_id: userId, is_system: false, official_code: null, official_category_id: inactive.id });
  await assert.rejects(resolveTransactionClassification({ supabase: client([inactive]), userId, transactionType: "expense", categoryId: inactive.id }), /Catégorie incompatible/);
  await assert.rejects(resolveTransactionClassification({ supabase: client([income]), userId, transactionType: "expense", categoryId: income.id }), /Catégorie incompatible/);
  await assert.rejects(resolveTransactionClassification({ supabase: client([preset, inactive]), userId, transactionType: "expense", categoryId: preset.id }), /Catégorie incompatible/);
});

test("représente une opération sans catégorie", async () => {
  assert.deepEqual(await resolveTransactionClassification({ supabase: client([]), userId, transactionType: "income", categoryId: null }), {
    categoryId: null,
    officialCategoryId: null,
    classificationPrecision: null,
    accountingNature: "ordinary",
  });
});

test("préserve une classification stable quand le même categoryId est retransmis", async () => {
  const result = await resolveTransactionClassificationForUpdate({
    supabase: client([]),
    userId,
    transactionType: "expense",
    existing: { accounting_nature: "ordinary", category_id: "preset-supprimé", official_category_id: "rubrique-stable", classification_precision: "Valeur historique" },
    categoryId: "preset-supprimé",
  });
  assert.equal(result.categoryId, "preset-supprimé");
  assert.equal(result.officialCategoryId, "rubrique-stable");
  assert.equal(result.classificationPrecision, "Valeur historique");
  assert.equal(result.accountingNature, "ordinary");
});

test("préserve aussi une classification stable quand categoryId est absent", async () => {
  const existing = { accounting_nature: "ordinary", category_id: "preset-inaccessible", official_category_id: "rubrique-stable", classification_precision: "Valeur historique" };
  assert.deepEqual(await resolveTransactionClassificationForUpdate({ supabase: client([]), userId, transactionType: "expense", existing }), {
    categoryId: existing.category_id,
    officialCategoryId: existing.official_category_id,
    classificationPrecision: existing.classification_precision,
    accountingNature: "ordinary",
  });
});

test("met à jour la précision avec le même categoryId sans relire le preset", async () => {
  const official = category({ active: false, requires_precision: true });
  const result = await resolveTransactionClassificationForUpdate({
    supabase: client([official]),
    userId,
    transactionType: "expense",
    existing: { accounting_nature: "ordinary", category_id: "preset-inaccessible", official_category_id: official.id, classification_precision: "Ancienne valeur" },
    categoryId: "preset-inaccessible",
    classificationPrecision: "  Nouvelle valeur  ",
  });
  assert.equal(result.categoryId, "preset-inaccessible");
  assert.equal(result.officialCategoryId, official.id);
  assert.equal(result.classificationPrecision, "Nouvelle valeur");
});

test("préserve une classification stable sans catégorie quand null est retransmis", async () => {
  assert.deepEqual(await resolveTransactionClassificationForUpdate({
    supabase: client([]),
    userId,
    transactionType: "expense",
    existing: { accounting_nature: "ordinary", category_id: null, official_category_id: null, classification_precision: null },
    categoryId: null,
  }), {
    categoryId: null,
    officialCategoryId: null,
    classificationPrecision: null,
    accountingNature: "ordinary",
  });
});

test("autorise une ancienne ligne À préciser lors d'une modification indépendante", async () => {
  const official = category({ active: false, requires_precision: true });
  const result = await resolveTransactionClassificationForUpdate({
    supabase: client([official]),
    userId,
    transactionType: "expense",
    existing: { accounting_nature: "ordinary", category_id: official.id, official_category_id: official.id, classification_precision: null },
    categoryId: official.id,
    classificationPrecision: null,
    requirePrecision: true,
  });
  assert.equal(result.classificationPrecision, null);
});

test("refuse une nouvelle catégorie À préciser sans précision lors d'un UPDATE manuel", async () => {
  const official = category({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", requires_precision: true });
  await assert.rejects(resolveTransactionClassificationForUpdate({
    supabase: client([official]),
    userId,
    transactionType: "expense",
    existing: { accounting_nature: "ordinary", category_id: null, official_category_id: null, classification_precision: null },
    categoryId: official.id,
    classificationPrecision: null,
    requirePrecision: true,
  }), ClassificationPrecisionRequiredError);
});

test("résout une nouvelle catégorie B lors d'un UPDATE A vers B", async () => {
  const officialB = category({ id: "77777777-7777-4777-8777-777777777777", requires_precision: true });
  const presetB = category({ id: "88888888-8888-4888-8888-888888888888", owner_id: userId, name: "Coiffeur", is_system: false, official_code: null, official_category_id: officialB.id });
  const readIds = [];
  const result = await resolveTransactionClassificationForUpdate({
    supabase: client([presetB, officialB], readIds),
    userId,
    transactionType: "expense",
    existing: { accounting_nature: "ordinary", category_id: "catégorie-A", official_category_id: "rubrique-officielle-A", classification_precision: "Ancienne précision" },
    categoryId: presetB.id,
    classificationPrecision: "  Coiffeur à domicile  ",
    requirePrecision: true,
  });

  assert.deepEqual(readIds, [presetB.id, officialB.id]);
  assert.deepEqual(result, {
    categoryId: presetB.id,
    officialCategoryId: officialB.id,
    classificationPrecision: "Coiffeur à domicile",
    accountingNature: "ordinary",
  });
  assert.notEqual(result.officialCategoryId, "rubrique-officielle-A");
  assert.notEqual(result.classificationPrecision, presetB.name);
});

test("refuse de convertir un mouvement de capital en opération ordinaire", async () => {
  await assert.rejects(resolveTransactionClassificationForUpdate({
    supabase: client([]),
    userId,
    transactionType: "expense",
    existing: { accounting_nature: "capital_movement", category_id: null, official_category_id: null, classification_precision: null },
    categoryId: null,
  }), /mouvement de capital/);
});

test("résout une ancienne classification non stabilisée et efface explicitement une catégorie", async () => {
  const official = category();
  const old = { accounting_nature: null, category_id: official.id, official_category_id: null, classification_precision: null };
  const stabilized = await resolveTransactionClassificationForUpdate({ supabase: client([official]), userId, transactionType: "expense", existing: old, categoryId: old.category_id });
  assert.equal(stabilized.officialCategoryId, official.id);
  const cleared = await resolveTransactionClassificationForUpdate({ supabase: client([official]), userId, transactionType: "expense", existing: old, categoryId: null });
  assert.deepEqual(cleared, { categoryId: null, officialCategoryId: null, classificationPrecision: null, accountingNature: "ordinary" });
});

test("calcule l'affichage et le préremplissage UX depuis la rubrique officielle", () => {
  const official = category({ requires_precision: true });
  const preset = category({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", owner_id: userId, name: "Coiffeur", is_system: false, official_code: null, official_category_id: official.id });
  assert.equal(getEffectiveOfficialCategory([preset, official], preset.id), official);
  assert.equal(getPrecisionAfterCategoryChange([preset, official], preset.id), "Coiffeur");
  assert.equal(getPrecisionAfterCategoryChange([official], official.id), "");
  assert.equal(getPrecisionAfterCategoryChange([preset, official], ""), "");
  assert.equal(getEffectiveOfficialCategory([official], preset.id, official.id), official);
});
