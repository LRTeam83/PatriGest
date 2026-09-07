import assert from "node:assert/strict";
import test from "node:test";

import { resolveEffectiveTransactionClassification } from "./transaction-classification-read.ts";

function category(overrides = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    owner_id: null,
    name: "Rubrique officielle",
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

function transaction(overrides = {}) {
  return {
    transaction_type: "expense",
    transfer_id: null,
    accounting_nature: "ordinary",
    category_id: null,
    official_category_id: null,
    classification_precision: null,
    ...overrides,
  };
}

function resolve(transactionOverrides = {}, categories = {}) {
  return resolveEffectiveTransactionClassification({
    transaction: transaction(transactionOverrides),
    stableOfficialCategory: categories.stable ?? null,
    legacyCategory: categories.legacy ?? null,
    legacyOfficialCategory: categories.legacyOfficial ?? null,
  });
}

test("résout une catégorie système double-écrite depuis la classification stable", () => {
  const official = category();
  const result = resolve({ category_id: official.id, official_category_id: official.id }, { stable: official, legacy: official });
  assert.equal(result.state, "classified");
  assert.equal(result.source, "stable");
  assert.equal(result.officialCategory, official);
});

test("donne la priorité stable à un preset double-écrit", () => {
  const stable = category();
  const divergent = category({ id: "22222222-2222-4222-8222-222222222222", name: "Rubrique divergente", official_code: "DEP-2-07" });
  const preset = category({ id: "33333333-3333-4333-8333-333333333333", owner_id: "user-a", name: "Preset renommé", is_system: false, official_code: null, official_category_id: divergent.id });
  const result = resolve({ category_id: preset.id, official_category_id: stable.id }, { stable, legacy: preset, legacyOfficial: divergent });
  assert.equal(result.state, "classified");
  assert.equal(result.source, "stable");
  assert.equal(result.officialCategory, stable);
});

test("lit la précision uniquement sur la transaction stable", () => {
  const official = category({ requires_precision: true });
  const preset = category({ id: "44444444-4444-4444-8444-444444444444", owner_id: "user-a", name: "Nom à ne pas copier", is_system: false, official_code: null, official_category_id: official.id });
  const result = resolve({ category_id: preset.id, official_category_id: official.id, classification_precision: "Précision stockée" }, { stable: official, legacy: preset, legacyOfficial: official });
  assert.deepEqual(result, { state: "classified", officialCategory: official, precision: "Précision stockée", source: "stable" });
});

test("signale une classification stable à préciser", () => {
  const official = category({ requires_precision: true });
  assert.deepEqual(resolve({ official_category_id: official.id }, { stable: official }), { state: "needs_precision", officialCategory: official, source: "stable" });
});

test("résout une ancienne catégorie système, même inactive", () => {
  const official = category({ active: false });
  const result = resolve({ accounting_nature: null, category_id: official.id }, { legacy: official });
  assert.equal(result.state, "classified");
  assert.equal(result.source, "legacy");
  assert.equal(result.officialCategory.active, false);
});

test("résout un ancien preset visible vers sa cible officielle", () => {
  const official = category({ requires_precision: true });
  const preset = category({ id: "55555555-5555-4555-8555-555555555555", owner_id: "user-a", name: "Coiffeur", is_system: false, official_code: null, official_category_id: official.id });
  const result = resolve({ accounting_nature: null, category_id: preset.id, classification_precision: null }, { legacy: preset, legacyOfficial: official });
  assert.deepEqual(result, { state: "needs_precision", officialCategory: official, source: "legacy" });
});

test("ne devine rien pour un ancien preset invisible", () => {
  assert.deepEqual(resolve({ accounting_nature: null, category_id: "preset-invisible" }), { state: "unclassified" });
});

test("retourne À classer sans catégorie", () => {
  assert.deepEqual(resolve(), { state: "unclassified" });
});

test("donne la priorité à un mouvement de capital", () => {
  const official = category();
  assert.deepEqual(resolve({ accounting_nature: "capital_movement", official_category_id: official.id }, { stable: official }), { state: "capital_movement" });
});

test("donne la priorité aux deux jambes de virement structuré", () => {
  const official = category();
  for (const transactionType of ["transfer_in", "transfer_out"]) {
    assert.deepEqual(resolve({ transaction_type: transactionType, transfer_id: "transfer-id", accounting_nature: "capital_movement", official_category_id: official.id }, { stable: official }), { state: "transfer" });
  }
});

test("ne classe pas comme ordinary un type transfert incohérent sans transfer_id", () => {
  const official = category();
  assert.deepEqual(resolve({ transaction_type: "transfer_in", official_category_id: official.id }, { stable: official }), { state: "unclassified" });
});

test("respecte la priorité capital_movement pour un type transfert non structuré", () => {
  assert.deepEqual(resolve({ transaction_type: "transfer_out", accounting_nature: "capital_movement" }), { state: "capital_movement" });
});

test("ignore le nom d'un preset renommé pour une ligne stable", () => {
  const official = category({ requires_precision: true });
  const preset = category({ id: "66666666-6666-4666-8666-666666666666", owner_id: "user-a", name: "Nouveau nom", is_system: false, official_code: null, official_category_id: official.id });
  const result = resolve({ category_id: preset.id, official_category_id: official.id, classification_precision: "Valeur historique" }, { stable: official, legacy: preset, legacyOfficial: official });
  assert.equal(result.state, "classified");
  assert.equal(result.precision, "Valeur historique");
});

test("rejette une rubrique stable invalide et utilise un fallback sûr", () => {
  const invalid = category({ is_system: false, owner_id: "user-a", official_code: null });
  const fallback = category({ id: "77777777-7777-4777-8777-777777777777" });
  const result = resolve({ category_id: fallback.id, official_category_id: invalid.id }, { stable: invalid, legacy: fallback });
  assert.equal(result.state, "classified");
  assert.equal(result.source, "legacy");
  assert.equal(result.officialCategory, fallback);
});

test("refuse les cibles legacy invalides, absentes ou incohérentes", () => {
  const preset = category({ id: "88888888-8888-4888-8888-888888888888", owner_id: "user-a", is_system: false, official_code: null, official_category_id: "target-id" });
  const invalidTarget = category({ id: "target-id", official_category_id: "parent-id" });
  assert.deepEqual(resolve({ accounting_nature: null, category_id: preset.id }, { legacy: preset }), { state: "unclassified" });
  assert.deepEqual(resolve({ accounting_nature: null, category_id: preset.id }, { legacy: preset, legacyOfficial: invalidTarget }), { state: "unclassified" });
});

test("n'affiche pas une précision incohérente sur une rubrique qui n'en accepte pas", () => {
  const official = category({ requires_precision: false });
  const result = resolve({ official_category_id: official.id, classification_precision: "Valeur parasite" }, { stable: official });
  assert.equal(result.state, "classified");
  assert.equal(result.precision, null);
});
