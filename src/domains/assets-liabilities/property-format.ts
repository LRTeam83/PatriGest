import type { PropertyEntryMode, PropertyEventType, PropertyType } from "@/types/database";

export const propertyTypeLabels: Record<PropertyType, string> = { house: "Maison", apartment: "Appartement", land: "Terrain", commercial: "Local", other: "Autre" };
export const propertyEntryModeLabels: Record<PropertyEntryMode, string> = { acquisition: "Acquisition", inheritance: "Succession", donation: "Donation", other: "Autre" };
export const propertyEventTypeLabels: Record<PropertyEventType, string> = { acquisition: "Acquisition", sale: "Vente", inheritance: "Succession", donation: "Donation", significant_change: "Modification significative" };

export function safePropertyText(value: string | null) {
  if (!value || /\b(?:unknown|undefined|null)\b/i.test(value)) return null;
  return value;
}
