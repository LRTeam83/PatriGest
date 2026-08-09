import type { AccountValuation, FinancialAccount, FinancialAccountType, Transaction } from "@/types/database";
import { calculateClassicBalance } from "@/domains/transactions/utils/transaction-utils";

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

export function getCurrentAccountValue(account: FinancialAccount, valuations: AccountValuation[], transactions: Transaction[] = []) {
  const movements = transactions.length ? transactions : (account as FinancialAccount & { transactions?: Transaction[] }).transactions ?? [];
  if (!isValuationAccount(account.account_type)) return { value: calculateClassicBalance(account.initial_balance, movements), valuation: null };
  if (valuations.length === 0) return { value: account.initial_balance, valuation: null };
  const valuation = [...valuations].sort((a, b) => b.valuation_date.localeCompare(a.valuation_date))[0];
  return { value: valuation.value, valuation };
}

export function getCurrentPatrimonyValue(accounts: Array<FinancialAccount & { valuations: AccountValuation[]; transactions: Transaction[] }>) {
  return accounts.filter((account) => account.status === "active").reduce((total, account) => total + getCurrentAccountValue(account, account.valuations, account.transactions).value, 0);
}
