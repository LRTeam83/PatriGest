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
  return <PrivateShell current="dossiers" dossier={{ id: protectedPersonId, name: `${person.first_name} ${person.last_name}`, current: "periods" }}>
    <AppBreadcrumb items={[{ label: "Dossiers", href: "/dossiers" }, { label: `${person.first_name} ${person.last_name}`, href: `/dossiers/${protectedPersonId}/comptes` }, { label: "Exercices de gestion" }]} />
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2563EB]">{person.first_name} {person.last_name}</p>
    <h1 className="mt-1 text-2xl font-bold sm:text-[28px]">Exercices de gestion</h1>
    <p className="mt-1 text-sm text-[#64748B]">Consultez les périodes ouvertes et clôturées du dossier.</p>
    <DossierNavigation protectedPersonId={protectedPersonId} current="periods" />
    <ManagementPeriodManager protectedPersonId={protectedPersonId} periods={person.managementPeriods} />
  </PrivateShell>;
}
