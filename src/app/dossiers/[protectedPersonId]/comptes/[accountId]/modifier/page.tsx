import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrivateShell } from "@/components/layout/private-shell";
import { FinancialAccountForm } from "@/domains/financial-accounts/components/financial-account-form";
import { getFinancialAccount } from "@/domains/financial-accounts/services/financial-account-service";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";

export const metadata: Metadata = { title: "Modifier un compte" };
export const dynamic = "force-dynamic";
export default async function EditFinancialAccountPage({ params }: { params: Promise<{ protectedPersonId: string; accountId: string }> }) { const { protectedPersonId, accountId } = await params; if (![protectedPersonId, accountId].every((id) => z.uuid().safeParse(id).success)) notFound(); const [person, account] = await Promise.all([getProtectedPerson(protectedPersonId), getFinancialAccount(accountId)]); if (!person || !account || account.protected_person_id !== protectedPersonId) notFound(); return <PrivateShell current="dossiers"><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">{person.first_name} {person.last_name}</p><h1 className="mt-2 text-3xl font-bold">Modifier le compte</h1><DossierNavigation protectedPersonId={protectedPersonId} current="accounts" /><section className="mt-8 max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8"><FinancialAccountForm protectedPersonId={protectedPersonId} account={account} /></section></PrivateShell>; }
