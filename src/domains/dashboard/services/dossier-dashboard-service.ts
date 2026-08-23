import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";
import { getFinancialAccounts } from "@/domains/financial-accounts/services/financial-account-service";
import { getTransactions } from "@/domains/transactions/services/transaction-service";
import { getManagementReports } from "@/domains/management-reports/services";

export async function getDossierDashboardData(protectedPersonId: string) {
  const person = await getProtectedPerson(protectedPersonId);
  if (!person) return null;

  const { supabase } = await getAuthenticatedUser();
  const [accounts, reports, recentTransactions, propertiesResult, debtsResult] =
    await Promise.all([
      getFinancialAccounts(protectedPersonId),
      getManagementReports(protectedPersonId),
      getTransactions(protectedPersonId, { limit: 5 }),
      supabase
        .from("real_estate_properties")
        .select("id", { count: "exact", head: true })
        .eq("protected_person_id", protectedPersonId),
      supabase
        .from("debts")
        .select("id", { count: "exact", head: true })
        .eq("protected_person_id", protectedPersonId)
        .eq("status", "active"),
    ]);

  if (propertiesResult.error || debtsResult.error)
    throw new Error("Impossible de charger la synthèse du dossier.");

  const activeReport = reports.find((report) =>
    ["draft", "ready", "generated"].includes(report.status),
  );
  const relevantReport = activeReport ?? reports[0] ?? null;
  const reportPeriodIds = new Set(
    reports.flatMap((report) =>
      report.management_period_id ? [report.management_period_id] : [],
    ),
  );
  const tasks = [
    ...person.managementPeriods
      .filter(
        (period) =>
          period.status === "closed" && !reportPeriodIds.has(period.id),
      )
      .map((period) => ({
        id: `report-${period.id}`,
        label: "Préparer le compte de gestion",
        detail: `Exercice clos le ${period.end_date}`,
        href: `/dossiers/${protectedPersonId}/comptes-de-gestion`,
        priority: 0,
        dueDate: period.end_date,
      })),
    ...person.managementPeriods
      .filter((period) => period.status === "open")
      .map((period) => ({
        id: `period-${period.id}`,
        label: "Exercice en cours",
        detail: `Échéance le ${period.end_date}`,
        href: `/dossiers/${protectedPersonId}/exercices`,
        priority: 1,
        dueDate: period.end_date,
      })),
    ...reports
      .filter((report) => report.status === "draft")
      .map((report) => ({
        id: `draft-${report.id}`,
        label: `Compte de gestion ${report.report_year} en préparation`,
        detail: `Période se terminant le ${report.period_end}`,
        href: `/dossiers/${protectedPersonId}/comptes-de-gestion/${report.id}`,
        priority: 2,
        dueDate: report.period_end,
      })),
  ].sort(
    (first, second) =>
      first.priority - second.priority ||
      first.dueDate.localeCompare(second.dueDate),
  );

  return {
    person,
    accounts,
    relevantReport,
    recentTransactions,
    tasks,
    propertyCount: propertiesResult.count ?? 0,
    activeDebtCount: debtsResult.count ?? 0,
  };
}
