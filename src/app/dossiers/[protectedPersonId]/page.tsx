import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CalendarDays, FilePenLine, MapPin, Scale, UserRound } from "lucide-react";
import { PrivateShell } from "@/components/layout/private-shell";
import { ManagementPeriodForm, ProtectionMeasureForm } from "@/domains/protected-persons/components/detail-forms";
import { getMeasureLabel } from "@/domains/protected-persons/schemas/protection-measure-schema";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";

export const metadata: Metadata = { title: "Fiche dossier - PatriGest" };
export const dynamic = "force-dynamic";

export default async function ProtectedPersonDetailPage({ params }: { params: Promise<{ protectedPersonId: string }> }) {
  const { protectedPersonId } = await params;
  if (!z.uuid().safeParse(protectedPersonId).success) notFound();
  const person = await getProtectedPerson(protectedPersonId);
  if (!person) notFound();

  const activeMeasure = person.protectionMeasures.find((measure) => measure.active);
  const openPeriod = person.managementPeriods.find((period) => period.status === "open");
  const address = [person.address_line1, person.address_line2, [person.postal_code, person.city].filter(Boolean).join(" ")].filter(Boolean);

  return <PrivateShell current="dossiers">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">Fiche dossier</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{person.first_name} {person.last_name}</h1><p className="mt-2 text-[#64748B]">Dossier {person.status === "active" ? "actif" : "archivé"}</p></div><button className="button button-secondary gap-2" type="button" disabled title="La modification complète sera ajoutée prochainement"><FilePenLine aria-hidden="true" size={17} />Modifier</button></div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <InfoCard icon={UserRound} title="Identité"><DataLine label="Nom complet" value={`${person.first_name} ${person.last_name}`} />{person.birth_name && <DataLine label="Nom de naissance" value={person.birth_name} />}{person.birth_date && <DataLine label="Date de naissance" value={formatDate(person.birth_date)} />}</InfoCard>
      <InfoCard icon={MapPin} title="Adresse">{address.length ? <address className="not-italic leading-7 text-[#475569]">{address.map((line) => <div key={line}>{line}</div>)}</address> : <p className="text-[#64748B]">Aucune adresse renseignée</p>}</InfoCard>
      <InfoCard icon={Scale} title="Mesure de protection">{activeMeasure ? <><p className="font-semibold">{getMeasureLabel(activeMeasure.measure_type)}</p>{activeMeasure.start_date && <p className="mt-2 text-sm text-[#64748B]">Depuis le {formatDate(activeMeasure.start_date)}</p>}</> : <p className="text-[#64748B]">Aucune mesure renseignée</p>}<details className="mt-5"><summary className="button button-secondary cursor-pointer list-none">Ajouter une mesure</summary><ProtectionMeasureForm protectedPersonId={person.id} /></details></InfoCard>
      <InfoCard icon={CalendarDays} title="Exercice de gestion">{openPeriod ? <><p className="font-semibold">Exercice ouvert</p><p className="mt-2 text-sm text-[#64748B]">Du {formatDate(openPeriod.start_date)} au {formatDate(openPeriod.end_date)}</p></> : <p className="text-[#64748B]">Aucun exercice créé</p>}<details className="mt-5"><summary className="button button-secondary cursor-pointer list-none">Créer un exercice</summary><ManagementPeriodForm protectedPersonId={person.id} /></details></InfoCard>
    </div>
  </PrivateShell>;
}

function InfoCard({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]"><Icon aria-hidden="true" size={19} /></span><h2 className="text-lg font-bold">{title}</h2></div><div className="mt-5">{children}</div></section>;
}

function DataLine({ label, value }: { label: string; value: string }) { return <div className="mb-3 last:mb-0"><p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p><p className="mt-1 text-[#334155]">{value}</p></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
