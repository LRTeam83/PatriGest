import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";
import {
  getProtectedPersonRegulatoryCompleteness,
  getProtectionMeasureRegulatoryCompleteness,
  getOfficialMeasureCorrespondence,
} from "@/domains/protected-persons/regulatory-helpers";
import { getProperties, getDebts } from "@/domains/assets-liabilities/services";
import { getFinancialAccounts } from "@/domains/financial-accounts/services/financial-account-service";
import { getLatestBankStatementAtOrBefore } from "@/domains/bank-statements/services";
import {
  aggregateReportOperations,
  calculateAccountSituations,
} from "./calculations";
import {
  getManagementReportCompleteness,
  type ReportSectionCompleteness,
} from "./completeness";
import type { Database } from "@/types/database";
import { buildManagementReportPreview } from "./preview-model";
export async function getManagementReports(personId: string) {
  const { supabase } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("management_reports")
    .select("*")
    .eq("protected_person_id", personId)
    .order("period_end", { ascending: false });
  if (error) throw new Error("Impossible de charger les comptes de gestion.");
  return data;
}
export async function getManagementReportDocument(
  personId: string,
  reportId: string,
  documentType: "management_report_draft" | "management_report",
) {
  const { supabase } = await getAuthenticatedUser();
  const report = await supabase
    .from("management_reports")
    .select("id")
    .eq("id", reportId)
    .eq("protected_person_id", personId)
    .maybeSingle();
  if (report.error) throw new Error("Impossible de vérifier le compte de gestion.");
  if (!report.data) return null;
  const { data, error } = await supabase
    .from("management_report_documents")
    .select("*")
    .eq("management_report_id", reportId)
    .eq("document_type", documentType)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger le document du compte de gestion.");
  return data;
}
export async function createManagementReport(
  personId: string,
  input: {
    managementPeriodId: string | null;
    reportYear: number;
    periodStart: string;
    periodEnd: string;
  },
) {
  const { supabase, userId } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("management_reports")
    .insert({
      protected_person_id: personId,
      management_period_id: input.managementPeriodId,
      report_year: input.reportYear,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error)
    throw new Error(
      error.code === "23505"
        ? "Un compte de gestion existe déjà pour cette période."
        : "Impossible de préparer le compte de gestion.",
    );
  return data;
}
export async function updateManagementReport(
  personId: string,
  reportId: string,
  input: Database["public"]["Tables"]["management_reports"]["Update"],
) {
  const { supabase } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("management_reports")
    .update(input)
    .eq("id", reportId)
    .eq("protected_person_id", personId)
    .select("id")
    .maybeSingle();
  if (error || !data)
    throw new Error("Impossible de modifier le compte de gestion.");
}
export async function updateManagementReportStatus(
  personId: string,
  reportId: string,
  currentStatus: "draft" | "ready",
  nextStatus: "draft" | "ready",
) {
  const { supabase } = await getAuthenticatedUser();
  const { data, error } = await supabase
    .from("management_reports")
    .update({ status: nextStatus })
    .eq("id", reportId)
    .eq("protected_person_id", personId)
    .eq("status", currentStatus)
    .select("id")
    .maybeSingle();
  if (error) throw new Error("Impossible de modifier le statut du compte de gestion.");
  return Boolean(data);
}
export async function getManagementReportSnapshot(
  personId: string,
  reportId: string,
) {
  const { supabase } = await getAuthenticatedUser();
  const [result, person, accounts, properties, debts] = await Promise.all([
    supabase
      .from("management_reports")
      .select("*")
      .eq("id", reportId)
      .eq("protected_person_id", personId)
      .maybeSingle(),
    getProtectedPerson(personId),
    getFinancialAccounts(personId),
    getProperties(personId),
    getDebts(personId),
  ]);
  if (result.error || !result.data || !person) return null;
  const report = result.data;
  const accountIds = accounts.map((account) => account.id);
  const empty = { data: [], error: null };
  const [categoryResult, transactionResult, latestStatements] =
    await Promise.all([
      supabase.from("categories").select("*"),
      accountIds.length
        ? supabase
            .from("transactions")
            .select("*")
            .in("financial_account_id", accountIds)
            .gte("transaction_date", report.period_start)
            .lte("transaction_date", report.period_end)
        : Promise.resolve(empty),
      Promise.all(accounts.map(async (account) => ({
        account,
        statement: await getLatestBankStatementAtOrBefore(account.id, report.period_end),
      }))),
    ]);
  if (categoryResult.error || transactionResult.error)
    throw new Error("Impossible de calculer le compte de gestion.");
  const aggregation = aggregateReportOperations(
    transactionResult.data,
    categoryResult.data,
    accounts,
  );
  const situations = calculateAccountSituations(
    accounts,
    accounts.flatMap((account) => account.transactions),
    accounts.flatMap((account) => account.valuations),
    report.period_start,
    report.period_end,
  );
  const activeMeasure =
    person.protectionMeasures.find((measure) => measure.active) ?? null;
  const personCheck = getProtectedPersonRegulatoryCompleteness(person);
  const measureCheck =
    getProtectionMeasureRegulatoryCompleteness(activeMeasure);
  const measureCorrespondence = activeMeasure
    ? getOfficialMeasureCorrespondence(activeMeasure.measure_type)
    : null;
  const propertyEvents = properties.flatMap((property) =>
    property.events
      .filter(
        (event) =>
          event.event_date >= report.period_start &&
          event.event_date <= report.period_end,
      )
      .map((event) => ({ property, event })),
  );
  const placementAccounts = accounts.filter(
    (account) =>
      account.account_type === "life_insurance" ||
      account.account_type === "other_investment",
  );
  const relevantDebts = debts
    .filter(
      (debt) =>
        (!debt.start_date || debt.start_date <= report.period_end) &&
        (!debt.settled_at || debt.settled_at >= report.period_start),
    )
    .map((debt) => ({
      debt,
      balance:
        debt.balances.find(
          (balance) => balance.balance_date <= report.period_end,
        ) ?? null,
    }));
  const sections: ReportSectionCompleteness[] = [
    {
      key: "person",
      label: "Personne protégée",
      complete: personCheck.complete && report.residence_changed !== null,
      missing: [
        ...personCheck.missingFields.map((item) => item.label),
        ...(report.residence_changed === null
          ? ["Changement de résidence"]
          : []),
      ],
    },
    {
      key: "measure",
      label: "Mesure de protection",
      complete:
        measureCheck.complete &&
        report.representative_address_changed !== null &&
        Boolean(measureCorrespondence?.direct),
      missing: [
        ...measureCheck.missingFields.map((item) => item.label),
        ...(report.representative_address_changed === null
          ? ["Changement d’adresse du représentant"]
          : []),
        ...(!measureCorrespondence?.direct
          ? ["Correspondance réglementaire du type de mesure"]
          : []),
      ],
    },
    {
      key: "acts",
      label: "Actes de gestion",
      complete:
        report.real_estate_confirmed !== null &&
        report.financial_investments_confirmed !== null,
      missing: [
        ...(report.real_estate_confirmed === null
          ? ["Confirmation du patrimoine immobilier"]
          : []),
        ...(report.financial_investments_confirmed === null
          ? ["Confirmation des placements"]
          : []),
      ],
    },
    {
      key: "operations",
      label: "Ressources et dépenses",
      complete: aggregation.unclassified === 0,
      missing: aggregation.unclassified
        ? [`${aggregation.unclassified} opération(s) sans classement officiel`]
        : [],
    },
    {
      key: "accounts",
      label: "Comptes et placements",
      complete: situations.every((item) => item.reliable),
      missing: situations
        .filter((item) => !item.reliable)
        .map(
          (item) =>
            `Solde de départ indisponible — ${item.account.account_name}`,
        ),
    },
    {
      key: "statements",
      label: "Relevés / pièces",
      complete: latestStatements.every((item) => Boolean(item.statement)),
      missing: latestStatements
        .filter((item) => !item.statement)
        .map((item) => `Relevé manquant — ${item.account.account_name}`),
    },
    {
      key: "debts",
      label: "Dettes",
      complete: relevantDebts.every((item) => Boolean(item.balance)),
      missing: relevantDebts
        .filter((item) => !item.balance)
        .map((item) => `Situation manquante — ${item.debt.creditor}`),
    },
    { key: "observations", label: "Observations", complete: true, missing: [] },
  ];
  return {
    report,
    person,
    properties,
    propertyEvents,
    placementAccounts,
    relevantDebts,
    aggregation,
    officialCategories: categoryResult.data.filter(
      (category) => category.is_system && Boolean(category.official_code),
    ),
    situations,
    latestStatements,
    activeMeasure,
    measureCorrespondence,
    completeness: getManagementReportCompleteness(sections),
  };
}

export async function getManagementReportPreview(
  personId: string,
  reportId: string,
) {
  const snapshot = await getManagementReportSnapshot(personId, reportId);
  return snapshot ? buildManagementReportPreview(snapshot) : null;
}
