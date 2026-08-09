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
  const closed = person.accessRole === "read_only" || isDateInClosedPeriod(transaction.transaction_date, person.managementPeriods);
  return <PrivateShell current="dossiers" dossier={{ id: protectedPersonId, name: `${person.first_name} ${person.last_name}`, current: "operations" }}>
    <AppBreadcrumb items={[{ label: "Dossiers", href: "/dossiers" }, { label: `${person.first_name} ${person.last_name}`, href: `/dossiers/${protectedPersonId}/comptes` }, { label: "Opérations", href: `/dossiers/${protectedPersonId}/operations` }, { label: "Modifier" }]} />
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2563EB]">{person.first_name} {person.last_name}</p>
    <h1 className="mt-1 text-2xl font-bold sm:text-[28px]">Modifier l’opération</h1>
    <DossierNavigation protectedPersonId={protectedPersonId} current="operations" />
    {closed ? <section className="mt-5 rounded-xl border border-[#E2E8F0] bg-white p-6 text-center"><span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-slate-100 text-[#64748B]"><LockKeyhole size={17} /></span><h2 className="mt-3 text-base font-bold">Exercice clôturé</h2><p className="mx-auto mt-1 max-w-xl text-xs text-[#64748B]">Cette opération appartient à un exercice clôturé et ne peut plus être modifiée.</p><Link href={`/dossiers/${protectedPersonId}/operations`} className="button button-secondary mt-4">Retour aux opérations</Link></section> : <section className="mt-5 max-w-4xl rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5"><TransactionForm personId={protectedPersonId} accounts={accounts} categories={categories} transaction={transaction} /></section>}
  </PrivateShell>;
}
