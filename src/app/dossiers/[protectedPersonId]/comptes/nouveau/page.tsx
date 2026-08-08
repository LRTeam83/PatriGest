import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrivateShell } from "@/components/layout/private-shell";
import { FinancialAccountForm } from "@/domains/financial-accounts/components/financial-account-form";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";

export const metadata: Metadata = { title: "Ajouter un compte" };
export const dynamic = "force-dynamic";
export default async function NewFinancialAccountPage({ params }: { params: Promise<{ protectedPersonId: string }> }) { const { protectedPersonId } = await params; if (!z.uuid().safeParse(protectedPersonId).success) notFound(); const person = await getProtectedPerson(protectedPersonId); if (!person) notFound(); return <PrivateShell current="dossiers"><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">{person.first_name} {person.last_name}</p><h1 className="mt-2 text-3xl font-bold">Ajouter un compte</h1><DossierNavigation protectedPersonId={protectedPersonId} current="accounts" /><section className="mt-8 max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8"><FinancialAccountForm protectedPersonId={protectedPersonId} /></section></PrivateShell>; }
