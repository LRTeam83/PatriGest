import type { Metadata } from "next";
import Link from "next/link";
import { FolderPlus, LogOut, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tableau de bord - PatriGest" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) redirect("/connexion");

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/tableau-de-bord" className="focus-ring flex items-center gap-2.5 rounded-xl" aria-label="PatriGest, tableau de bord">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white"><ShieldCheck aria-hidden="true" size={22} /></span>
            <span className="text-xl font-bold">PatriGest</span>
          </Link>
          <form action={logoutAction}>
            <button className="button button-secondary gap-2" type="submit"><LogOut aria-hidden="true" size={17} />Déconnexion</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">Votre espace privé</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Tableau de bord</h1>
          <p className="mt-4 text-lg leading-8 text-[#64748B]">Bienvenue dans votre espace PatriGest sécurisé.</p>
        </div>
        <section className="mt-10 max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-8" aria-labelledby="ready-title">
          <div className="flex size-12 items-center justify-center rounded-xl bg-green-50 text-[#16A34A]"><FolderPlus aria-hidden="true" size={22} /></div>
          <h2 id="ready-title" className="mt-5 text-xl font-bold">PatriGest est prêt</h2>
          <p className="mt-3 leading-7 text-[#64748B]">Votre espace est prêt à accueillir vos premiers dossiers de personnes protégées. Cette fonctionnalité sera disponible prochainement.</p>
        </section>
      </main>
    </div>
  );
}
