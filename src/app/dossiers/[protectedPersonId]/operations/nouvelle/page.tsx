import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PrivateShell } from "@/components/layout/private-shell";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { getCategories } from "@/domains/categories/services/category-service";
import { getFinancialAccounts } from "@/domains/financial-accounts/services/financial-account-service";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";
import { TransactionForm } from "@/domains/transactions/components/transaction-form";

export const metadata: Metadata = { title: "Nouvelle opération" };
export const dynamic = "force-dynamic";

export default async function NewOperationPage({ params }: { params: Promise<{ protectedPersonId: string }> }) {
  const { protectedPersonId } = await params;
  if (!z.uuid().safeParse(protectedPersonId).success) notFound();
  const person = await getProtectedPerson(protectedPersonId);
  if (!person) notFound();
  const [accounts, categories] = await Promise.all([getFinancialAccounts(protectedPersonId), getCategories(false)]);
  return <PrivateShell current="dossiers">
    <AppBreadcrumb items={[{ label: "Tableau de bord", href: "/tableau-de-bord" }, { label: `${person.first_name} ${person.last_name}`, href: `/dossiers/${protectedPersonId}` }, { label: "Opérations", href: `/dossiers/${protectedPersonId}/operations` }, { label: "Nouvelle opération" }]} />
    <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">{person.first_name} {person.last_name}</p>
    <h1 className="mt-2 text-3xl font-bold">Ajouter une opération</h1>
    <DossierNavigation protectedPersonId={protectedPersonId} current="operations" />
    <section className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8"><TransactionForm personId={protectedPersonId} accounts={accounts} categories={categories} /></section>
  </PrivateShell>;
}
