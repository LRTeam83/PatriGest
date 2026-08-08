import type { AccountValuation, FinancialAccount, FinancialAccountType } from "@/types/database";

export const financialAccountLabels: Record<FinancialAccountType, string> = {
  checking: "Compte courant", livret_a: "Livret A", ldds: "LDDS", csl: "CSL", lep: "LEP",
  pel: "PEL", term_account: "Compte à terme", life_insurance: "Assurance-vie", other_investment: "Autre placement",
};

export function isValuationAccount(type: FinancialAccountType) {
  return type === "life_insurance" || type === "other_investment";
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

export function formatFinancialDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function getCurrentAccountValue(account: FinancialAccount, valuations: AccountValuation[]) {
  if (!isValuationAccount(account.account_type) || valuations.length === 0) return { value: account.initial_balance, valuation: null };
  const valuation = [...valuations].sort((a, b) => b.valuation_date.localeCompare(a.valuation_date))[0];
  return { value: valuation.value, valuation };
}
