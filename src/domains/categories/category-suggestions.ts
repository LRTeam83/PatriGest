import type { Category, CategoryUsage } from "@/types/database";

const keywordsByOfficialCode: Record<string, readonly string[]> = {
  "DEP-1-02": ["aliment", "supermarché", "épicerie", "boulangerie"],
  "DEP-1-04": ["pharmacie", "médecin", "hôpital", "santé"],
  "DEP-1-07": ["transport", "train", "bus", "taxi", "carburant"],
  "DEP-2-01": ["loyer"],
  "DEP-2-03": ["électricité", "edf"],
  "DEP-2-04": ["gaz"],
  "DEP-2-05": ["eau"],
  "DEP-2-06": ["téléphone", "internet", "mobile"],
  "RES-1-02": ["retraite"],
  "RES-1-05": ["loyer", "locatif"],
  "RES-3-01": ["intérêt", "dividende"],
  "RES-4-03": ["remboursement", "cpam", "mutuelle"],
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR");

export function suggestOfficialCategories(label: string, usage: Exclude<CategoryUsage, "both">, officialCategories: readonly Category[]): Category[] {
  const normalizedLabel = normalize(label);
  return officialCategories.filter((category) => category.is_system && category.usage === usage && category.official_code &&
    (keywordsByOfficialCode[category.official_code] ?? []).some((keyword) => normalizedLabel.includes(normalize(keyword))));
}
