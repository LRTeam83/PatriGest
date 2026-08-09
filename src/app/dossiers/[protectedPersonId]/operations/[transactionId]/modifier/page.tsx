import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { z } from "zod";
import { PrivateShell } from "@/components/layout/private-shell";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { getCategories } from "@/domains/categories/services/category-service";
import { getFinancialAccounts } from "@/domains/financial-accounts/services/financial-account-service";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";
import { TransactionForm } from "@/domains/transactions/components/transaction-form";
import { getTransaction } from "@/domains/transactions/services/transaction-service";
import { isDateInClosedPeriod } from "@/domains/transactions/utils/transaction-utils";

export const metadata: Metadata = { title: "Modifier l’opération" };
export const dynamic = "force-dynamic";

export default async function EditOperationPage({ params }: { params: Promise<{ protectedPersonId: string; transactionId: string }> }) {
  const { protectedPersonId, transactionId } = await params;
  if (![protectedPersonId, transactionId].every((id) => z.uuid().safeParse(id).success)) notFound();
  const person = await getProtectedPerson(protectedPersonId);
  if (!person) notFound();
  const [accounts, categories, transaction] = await Promise.all([getFinancialAccounts(protectedPersonId), getCategories(false), getTransaction(transactionId)]);
  if (!transaction || transaction.transfer_id || transaction.account.protected_person_id !== protectedPersonId) notFound();
  const closed = isDateInClosedPeriod(transaction.transaction_date, person.managementPeriods);
  return <PrivateShell current="dossiers">
    <AppBreadcrumb items={[{ label: "Tableau de bord", href: "/tableau-de-bord" }, { label: `${person.first_name} ${person.last_name}`, href: `/dossiers/${protectedPersonId}` }, { label: "Opérations", href: `/dossiers/${protectedPersonId}/operations` }, { label: "Modifier" }]} />
    <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">{person.first_name} {person.last_name}</p>
    <h1 className="mt-2 text-3xl font-bold">Modifier l’opération</h1>
    <DossierNavigation protectedPersonId={protectedPersonId} current="operations" />
    {closed ? <section className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-slate-100 text-[#64748B]"><LockKeyhole size={20} /></span><h2 className="mt-4 text-lg font-bold">Exercice clôturé</h2><p className="mx-auto mt-2 max-w-xl text-sm text-[#64748B]">Cette opération appartient à un exercice clôturé et ne peut plus être modifiée.</p><Link href={`/dossiers/${protectedPersonId}/operations`} className="button button-secondary mt-6">Retour aux opérations</Link></section> : <section className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8"><TransactionForm personId={protectedPersonId} accounts={accounts} categories={categories} transaction={transaction} /></section>}
  </PrivateShell>;
}
