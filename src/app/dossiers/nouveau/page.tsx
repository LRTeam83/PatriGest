import type { Metadata } from "next";
import { PrivateShell } from "@/components/layout/private-shell";
import { ProtectedPersonForm } from "@/domains/protected-persons/components/protected-person-form";
import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";

export const metadata: Metadata = { title: "Nouveau dossier" };
export const dynamic = "force-dynamic";

export default async function NewProtectedPersonPage() {
  await getAuthenticatedUser();
  return <PrivateShell current="dossiers">
    <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">Dossiers</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Nouveau dossier</h1><p className="mt-2 text-[#64748B]">Renseignez les informations essentielles de la personne protégée.</p>
      <section className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8"><ProtectedPersonForm /></section>
    </div>
  </PrivateShell>;
}
