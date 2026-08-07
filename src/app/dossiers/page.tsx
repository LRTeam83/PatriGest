import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, Plus, UserRound } from "lucide-react";
import { PrivateShell } from "@/components/layout/private-shell";
import { getProtectedPersons } from "@/domains/protected-persons/services/protected-person-service";

export const metadata: Metadata = { title: "Dossiers - PatriGest" };
export const dynamic = "force-dynamic";

export default async function ProtectedPersonsPage() {
  const persons = await getProtectedPersons();
  return <PrivateShell current="dossiers">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">Personnes protégées</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Dossiers</h1><p className="mt-2 text-[#64748B]">Retrouvez et gérez les dossiers qui vous sont confiés.</p></div>
      <Link href="/dossiers/nouveau" className="button button-primary gap-2"><Plus aria-hidden="true" size={18} />Nouveau dossier</Link>
    </div>
    {persons.length === 0 ? <section className="mt-10 rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center sm:p-12">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]"><FolderOpen aria-hidden="true" size={25} /></div>
      <h2 className="mt-5 text-xl font-bold">Aucun dossier n’a encore été créé.</h2>
      <p className="mx-auto mt-2 max-w-md leading-7 text-[#64748B]">Créez votre premier dossier pour commencer à renseigner une personne protégée.</p>
      <Link href="/dossiers/nouveau" className="button button-primary mt-6 gap-2"><Plus aria-hidden="true" size={18} />Créer mon premier dossier</Link>
    </section> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{persons.map((person) => <Link key={person.id} href={`/dossiers/${person.id}`} className="focus-ring group rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:border-blue-200 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)]">
      <div className="flex items-start justify-between gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]"><UserRound aria-hidden="true" size={21} /></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${person.status === "active" ? "bg-green-50 text-[#16A34A]" : "bg-slate-100 text-[#64748B]"}`}>{person.status === "active" ? "Actif" : "Archivé"}</span></div>
      <h2 className="mt-5 text-lg font-bold group-hover:text-[#2563EB]">{person.first_name} {person.last_name}</h2>
      <p className="mt-2 text-sm text-[#64748B]">{person.city || "Commune non renseignée"}</p>
    </Link>)}</div>}
  </PrivateShell>;
}
