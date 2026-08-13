import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CalendarDays, FilePenLine, MapPin, Scale, UserRound, WalletCards } from "lucide-react";
import { PrivateShell } from "@/components/layout/private-shell";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { getFinancialAccounts } from "@/domains/financial-accounts/services/financial-account-service";
import { formatCurrency, getCurrentPatrimonyValue } from "@/domains/financial-accounts/utils/financial-account-utils";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { DeleteProtectedPerson } from "@/domains/protected-persons/components/delete-protected-person";
import { ProtectionMeasureForm } from "@/domains/protected-persons/components/detail-forms";
import { getMeasureLabel } from "@/domains/protected-persons/schemas/protection-measure-schema";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";

export const metadata: Metadata = { title: "Fiche dossier" };
export const dynamic = "force-dynamic";

export default async function ProtectedPersonDetailPage({ params }: { params: Promise<{ protectedPersonId: string }> }) {
  const { protectedPersonId } = await params;
  if (!z.uuid().safeParse(protectedPersonId).success) notFound();
  const person = await getProtectedPerson(protectedPersonId);
  if (!person) notFound();
  const accounts = await getFinancialAccounts(protectedPersonId);

  const activeMeasure = person.protectionMeasures.find((measure) => measure.active);
  const openPeriod = person.managementPeriods.find((period) => period.status === "open");
  const address = [person.address_line1, person.address_line2, [person.postal_code, person.city].filter(Boolean).join(" ")].filter(Boolean);
  const currentPatrimony = getCurrentPatrimonyValue(accounts);

  return <PrivateShell current="dossiers" dossier={{ id: protectedPersonId, name: `${person.first_name} ${person.last_name}`, current: "overview" }}>
    <AppBreadcrumb items={[{ label: "Dossiers", href: "/dossiers" }, { label: `${person.first_name} ${person.last_name}`, href: `/dossiers/${protectedPersonId}/comptes` }, { label: "Informations du dossier" }]} />
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">Fiche dossier</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{person.first_name} {person.last_name}</h1><p className="mt-1 text-sm text-[#64748B]">Dossier {person.status === "active" ? "actif" : "archivé"}</p></div><button className="button button-secondary min-h-9 gap-2 px-4" type="button" disabled title="La modification complète sera ajoutée prochainement"><FilePenLine aria-hidden="true" size={16} />Modifier</button></div>
    <DossierNavigation protectedPersonId={protectedPersonId} current="overview" />
    <div className="mt-6 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard icon={WalletCards} title="Patrimoine actuel"><p className="text-2xl font-bold">{formatCurrency(currentPatrimony)}</p><Link href={`/dossiers/${protectedPersonId}/comptes`} className="auth-link mt-2 inline-block text-xs">Voir les comptes</Link></InfoCard>
      <InfoCard icon={UserRound} title="Identité"><DataLine label="Nom complet" value={`${person.first_name} ${person.last_name}`} />{person.birth_name && <DataLine label="Nom de naissance" value={person.birth_name} />}{person.birth_date && <DataLine label="Date de naissance" value={formatDate(person.birth_date)} />}</InfoCard>
      <InfoCard icon={MapPin} title="Adresse">{address.length ? <address className="not-italic text-sm leading-6 text-[#475569]">{address.map((line) => <div key={line}>{line}</div>)}</address> : <p className="text-sm text-[#64748B]">Aucune adresse renseignée</p>}</InfoCard>
      <div id="mesure-protection" className="scroll-mt-28"><InfoCard icon={Scale} title="Mesure de protection">{activeMeasure ? <><p className="text-sm font-semibold">{getMeasureLabel(activeMeasure.measure_type)}</p>{activeMeasure.start_date && <p className="mt-1 text-xs text-[#64748B]">Depuis le {formatDate(activeMeasure.start_date)}</p>}</> : <p className="text-sm text-[#64748B]">Aucune mesure renseignée</p>}<details className="mt-3"><summary className="button button-secondary min-h-9 cursor-pointer list-none px-4">Ajouter une mesure</summary><ProtectionMeasureForm protectedPersonId={person.id} /></details></InfoCard></div>
      <InfoCard icon={CalendarDays} title="Exercice de gestion">{openPeriod ? <><p className="text-sm font-semibold">Exercice ouvert</p><p className="mt-1 text-xs text-[#64748B]">Du {formatDate(openPeriod.start_date)} au {formatDate(openPeriod.end_date)}</p></> : <p className="text-sm text-[#64748B]">Aucun exercice ouvert</p>}<Link href={`/dossiers/${protectedPersonId}/exercices`} className="button button-secondary mt-3 min-h-9 px-4">Gérer les exercices</Link></InfoCard>
    </div>
    {person.accessRole === "owner" && <section className="mt-4 rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-3"><h2 className="text-sm font-bold">Gestion du dossier</h2><p className="mt-1 text-xs text-[#64748B]">La suppression définitive est disponible uniquement lorsque le dossier ne contient plus aucune donnée associée.</p><div className="mt-2"><DeleteProtectedPerson protectedPersonId={protectedPersonId} personName={`${person.first_name} ${person.last_name}`} /></div></section>}
  </PrivateShell>;
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: React.ReactNode }) {
  return <section className="self-start rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-3 shadow-[0_6px_18px_rgba(15,23,42,0.035)]"><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]"><Icon aria-hidden="true" size={15} /></span><h2 className="text-sm font-bold">{title}</h2></div><div className="mt-2.5">{children}</div></section>;
}

function DataLine({ label, value }: { label: string; value: string }) { return <div className="mb-2 last:mb-0"><p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p><p className="mt-0.5 text-sm text-[#334155]">{value}</p></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
