import type { Metadata } from "next";
import Link from "next/link";
import { FolderPlus, UsersRound } from "lucide-react";
import { PrivateShell } from "@/components/layout/private-shell";
import { getProtectedPersons } from "@/domains/protected-persons/services/protected-person-service";

export const metadata: Metadata = { title: "Tableau de bord - PatriGest" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const persons = await getProtectedPersons();
  const activePersons = persons.filter((person) => person.status === "active");
  return <PrivateShell current="dashboard">
    <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">Votre espace privé</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tableau de bord</h1><p className="mt-3 text-lg text-[#64748B]">Bienvenue dans votre espace PatriGest sécurisé.</p></div>
    {persons.length === 0 ? <section className="mt-10 max-w-2xl rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center sm:p-10"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-green-50 text-[#16A34A]"><FolderPlus aria-hidden="true" size={25} /></div><h2 className="mt-5 text-xl font-bold">Aucun dossier n’a encore été créé.</h2><p className="mt-2 leading-7 text-[#64748B]">PatriGest est prêt à accueillir votre premier dossier de personne protégée.</p><Link href="/dossiers/nouveau" className="button button-primary mt-6 gap-2"><FolderPlus aria-hidden="true" size={18} />Créer mon premier dossier</Link></section> : <div className="mt-10 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6"><div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]"><UsersRound aria-hidden="true" size={21} /></div><p className="mt-5 text-sm font-medium text-[#64748B]">Dossiers actifs</p><p className="mt-1 text-3xl font-bold">{activePersons.length}</p></section>
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Dossiers récents</h2><Link href="/dossiers" className="auth-link text-sm">Voir tous</Link></div><div className="mt-4 divide-y divide-[#E2E8F0]">{persons.slice(0, 4).map((person) => <Link key={person.id} href={`/dossiers/${person.id}`} className="focus-ring flex items-center justify-between gap-4 rounded-lg py-3"><span className="font-semibold">{person.first_name} {person.last_name}</span><span className="text-sm text-[#64748B]">{person.city || "—"}</span></Link>)}</div></section>
    </div>}
  </PrivateShell>;
}
