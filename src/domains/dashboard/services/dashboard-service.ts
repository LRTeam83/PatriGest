import type { FinancialAccount, ManagementPeriod, ProtectedPerson, Transaction } from "@/types/database";
import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";
import { getCurrentPatrimonyValue } from "@/domains/financial-accounts/utils/financial-account-utils";

export type DashboardTransaction = Transaction & {
  account: Pick<FinancialAccount, "id" | "account_name" | "protected_person_id">;
  person: Pick<ProtectedPerson, "id" | "first_name" | "last_name">;
};

export async function getDashboardData() {
  const { supabase, userId } = await getAuthenticatedUser();
  const [{ data: profile, error: profileError }, { data: persons, error: personsError }] = await Promise.all([
    supabase.from("profiles").select("first_name").eq("id", userId).maybeSingle(),
    supabase.from("protected_persons").select("*").eq("owner_id", userId).order("updated_at", { ascending: false }),
  ]);
  if (profileError || personsError) throw new Error("Impossible de charger le tableau de bord.");

  const personIds = persons.map((person) => person.id);
  if (!personIds.length) return { firstName: profile?.first_name ?? null, activeDossiers: 0, activeAccounts: 0, currentPatrimony: 0, upcomingPeriods: [] as ManagementPeriod[], recentTransactions: [] as DashboardTransaction[] };

  const [{ data: accounts, error: accountsError }, { data: periods, error: periodsError }] = await Promise.all([
    supabase.from("financial_accounts").select("*").in("protected_person_id", personIds),
    supabase.from("management_periods").select("*").in("protected_person_id", personIds).eq("status", "open").order("end_date", { ascending: true }),
  ]);
  if (accountsError || periodsError) throw new Error("Impossible de charger le tableau de bord.");

  const accountIds = accounts.map((account) => account.id);
  const [{ data: valuations, error: valuationsError }, { data: transactions, error: transactionsError }] = accountIds.length ? await Promise.all([
    supabase.from("account_valuations").select("*").in("financial_account_id", accountIds).order("valuation_date", { ascending: false }),
    supabase.from("transactions").select("*").in("financial_account_id", accountIds).order("transaction_date", { ascending: false }).order("created_at", { ascending: false }),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (valuationsError || transactionsError) throw new Error("Impossible de charger le tableau de bord.");

  const accountsWithData = accounts.map((account) => ({ ...account, valuations: valuations.filter((valuation) => valuation.financial_account_id === account.id), transactions: transactions.filter((transaction) => transaction.financial_account_id === account.id) }));
  const activePersonIds = new Set(persons.filter((person) => person.status === "active").map((person) => person.id));
  const patrimonyAccounts = accountsWithData.filter((account) => activePersonIds.has(account.protected_person_id));
  const recentTransactions = transactions.slice(0, 5).flatMap((transaction) => {
    const account = accounts.find((item) => item.id === transaction.financial_account_id);
    const person = account ? persons.find((item) => item.id === account.protected_person_id) : undefined;
    return account && person ? [{ ...transaction, account: { id: account.id, account_name: account.account_name, protected_person_id: account.protected_person_id }, person: { id: person.id, first_name: person.first_name, last_name: person.last_name } }] : [];
  });

  return {
    firstName: profile?.first_name ?? null,
    activeDossiers: activePersonIds.size,
    activeAccounts: accounts.filter((account) => account.status === "active").length,
    currentPatrimony: getCurrentPatrimonyValue(patrimonyAccounts),
    upcomingPeriods: periods,
    recentTransactions,
  };
}
