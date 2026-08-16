import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrivateShell } from "@/components/layout/private-shell";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { ManagementReportPreviewView } from "@/domains/management-reports/preview";
import { getManagementReportPreview } from "@/domains/management-reports/services";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ protectedPersonId: string; reportId: string }>;
}) {
  const { protectedPersonId, reportId } = await params;
  if (![protectedPersonId, reportId].every((id) => z.uuid().safeParse(id).success)) notFound();
  const preview = await getManagementReportPreview(protectedPersonId, reportId);
  if (!preview) notFound();
  const personName = `${preview.person.first_name} ${preview.person.last_name}`;
  const reportHref = `/dossiers/${protectedPersonId}/comptes-de-gestion/${reportId}`;
  return <PrivateShell current="dossiers" dossier={{ id: protectedPersonId, name: personName, current: "reports", accessRole: preview.person.accessRole }}>
    <AppBreadcrumb items={[{ label: "Dossiers", href: "/dossiers" }, { label: personName, href: `/dossiers/${protectedPersonId}/comptes` }, { label: "Comptes de gestion", href: `/dossiers/${protectedPersonId}/comptes-de-gestion` }, { label: String(preview.report.report_year), href: reportHref }, { label: "Aperçu" }]} />
    <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
      <div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{personName}</p><h1 className="mt-1 text-2xl font-bold">Aperçu réglementaire</h1><p className="mt-1 text-xs text-slate-500">Lecture seule · aucun document officiel n’est généré.</p></div>
      <Link className="button button-secondary" href={reportHref}>Retour à la préparation</Link>
    </div>
    <div className="print:hidden"><DossierNavigation protectedPersonId={protectedPersonId} current="reports" /></div>
    {["ready", "generated", "finalized"].includes(preview.report.status) ? <ManagementReportPreviewView preview={preview} /> : <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><h2 className="font-bold text-amber-900">Aperçu indisponible</h2><p className="mt-1 text-sm text-amber-800">Le compte de gestion doit être marqué comme prêt avant de présenter son aperçu réglementaire.</p><Link className="button button-secondary mt-3" href={reportHref}>Revenir à la préparation</Link></div>}
  </PrivateShell>;
}
