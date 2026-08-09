import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrivateShell } from "@/components/layout/private-shell";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { ManagementPeriodManager } from "@/domains/protected-persons/components/management-period-manager";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";

export const metadata: Metadata = { title: "Exercices de gestion" };
export const dynamic = "force-dynamic";

export default async function ManagementPeriodsPage({ params }: { params: Promise<{ protectedPersonId: string }> }) {
  const { protectedPersonId } = await params;
  if (!z.uuid().safeParse(protectedPersonId).success) notFound();
  const person = await getProtectedPerson(protectedPersonId);
  if (!person) notFound();
  return <PrivateShell current="dossiers">
    <AppBreadcrumb items={[{ label: "Tableau de bord", href: "/tableau-de-bord" }, { label: `${person.first_name} ${person.last_name}`, href: `/dossiers/${protectedPersonId}` }, { label: "Exercices de gestion" }]} />
    <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">{person.first_name} {person.last_name}</p>
    <h1 className="mt-2 text-3xl font-bold">Exercices de gestion</h1>
    <p className="mt-2 text-[#64748B]">Consultez les périodes ouvertes et clôturées du dossier.</p>
    <DossierNavigation protectedPersonId={protectedPersonId} current="periods" />
    <ManagementPeriodManager protectedPersonId={protectedPersonId} periods={person.managementPeriods} />
  </PrivateShell>;
}
