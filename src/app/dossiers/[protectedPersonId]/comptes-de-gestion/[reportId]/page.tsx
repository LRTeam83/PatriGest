import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { PrivateShell } from "@/components/layout/private-shell";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { ManagementReportDashboard } from "@/domains/management-reports/components";
import { ReportDocumentActions } from "@/domains/management-reports/report-document-actions";
import { ReportTransmission } from "@/domains/management-reports/report-transmission";
import { getManagementReportDocument, getManagementReportSnapshot } from "@/domains/management-reports/services";
import { formatFinancialDate } from "@/domains/financial-accounts/utils/financial-account-utils";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ protectedPersonId: string; reportId: string }>;
}) {
  const { protectedPersonId, reportId } = await params;
  if (
    ![protectedPersonId, reportId].every((id) => z.uuid().safeParse(id).success)
  )
    notFound();
  const snapshot = await getManagementReportSnapshot(
    protectedPersonId,
    reportId,
  );
  if (!snapshot) notFound();
  const person = snapshot.person;
  const documentType = snapshot.report.status === "generated"
    ? "management_report_draft" as const
    : ["finalized", "transmitted"].includes(snapshot.report.status)
      ? "management_report" as const
      : null;
  const document = documentType
    ? await getManagementReportDocument(protectedPersonId, reportId, documentType)
    : null;
  const statusLabel = snapshot.report.status === "transmitted"
    ? "Transmis"
    : snapshot.report.status === "finalized"
    ? "Finalisé"
    : snapshot.report.status === "generated"
      ? "Projet généré"
    : snapshot.report.status === "ready"
      ? "Prêt"
      : "En préparation";
  return (
    <PrivateShell
      current="dossiers"
      dossier={{
        id: protectedPersonId,
        name: `${person.first_name} ${person.last_name}`,
        current: "reports",
        accessRole: person.accessRole,
      }}
    >
      <AppBreadcrumb
        items={[
          { label: "Dossiers", href: "/dossiers" },
          {
            label: `${person.first_name} ${person.last_name}`,
            href: `/dossiers/${protectedPersonId}/comptes`,
          },
          {
            label: "Comptes de gestion",
            href: `/dossiers/${protectedPersonId}/comptes-de-gestion`,
          },
          { label: String(snapshot.report.report_year) },
        ]}
      />
      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
        {person.first_name} {person.last_name}
      </p>
      <h1 className="mt-1 text-2xl font-bold">
        Compte de gestion {snapshot.report.report_year}
      </h1>
      <p className="text-xs text-slate-500">
        {formatFinancialDate(snapshot.report.period_start)} →{" "}
        {formatFinancialDate(snapshot.report.period_end)} ·{" "}
        {statusLabel}
      </p>
      {["ready", "generated", "finalized", "transmitted"].includes(snapshot.report.status) && (
        <Link
          className="button button-secondary mt-3"
          href={`/dossiers/${protectedPersonId}/comptes-de-gestion/${reportId}/apercu`}
        >
          Voir l’aperçu
        </Link>
      )}
      <DossierNavigation
        protectedPersonId={protectedPersonId}
        current="reports"
      />
      <ManagementReportDashboard
        snapshot={snapshot}
        canManage={person.accessRole !== "read_only"}
      />
      <ReportDocumentActions
        personId={protectedPersonId}
        reportId={reportId}
        status={snapshot.report.status}
        canManage={person.accessRole !== "read_only"}
        hasDocument={Boolean(document)}
      />
      {["finalized", "transmitted"].includes(snapshot.report.status) && (
        <ReportTransmission
          personId={protectedPersonId}
          reportId={reportId}
          status={snapshot.report.status}
          finalizedAt={snapshot.report.finalized_at}
          transmission={snapshot.reportTransmission}
          canManage={person.accessRole !== "read_only"}
        />
      )}
    </PrivateShell>
  );
}
