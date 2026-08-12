import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { z } from "zod";
import { PrivateShell } from "@/components/layout/private-shell";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { formatCurrency, formatFinancialDate } from "@/domains/financial-accounts/utils/financial-account-utils";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";
import { TransactionDeleteButton } from "@/domains/transactions/components/transaction-delete-button";
import { getTransactions } from "@/domains/transactions/services/transaction-service";
import { isDateInClosedPeriod } from "@/domains/transactions/utils/transaction-utils";

export const metadata: Metadata = { title: "Consulter l’opération" };
export const dynamic = "force-dynamic";

export default async function OperationDetailPage({ params }: { params: Promise<{ protectedPersonId: string; transactionId: string }> }) {
  const { protectedPersonId, transactionId } = await params;
  if (![protectedPersonId, transactionId].every((id) => z.uuid().safeParse(id).success)) notFound();
  const person = await getProtectedPerson(protectedPersonId);
  if (!person) notFound();
  const item = (await getTransactions(protectedPersonId)).find((transaction) => transaction.id === transactionId);
  if (!item) notFound();
  if (!item.transfer_id) redirect(`/dossiers/${protectedPersonId}/operations/${transactionId}/modifier`);
  const closed = isDateInClosedPeriod(item.transaction_date, person.managementPeriods);
  const canManage = person.accessRole !== "read_only" && !closed;
  const returnHref = `/dossiers/${protectedPersonId}/comptes/${item.financial_account_id}/operations`;
  return <PrivateShell current="dossiers" dossier={{ id: protectedPersonId, name: `${person.first_name} ${person.last_name}`, current: "operations" }}><AppBreadcrumb items={[{ label: "Dossiers", href: "/dossiers" }, { label: `${person.first_name} ${person.last_name}`, href: `/dossiers/${protectedPersonId}/comptes` }, { label: item.account.account_name, href: returnHref }, { label: "Virement" }]} /><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2563EB]">{person.first_name} {person.last_name}</p><h1 className="mt-1 text-2xl font-bold sm:text-[28px]">Consulter le virement</h1></div>{canManage && <TransactionDeleteButton personId={protectedPersonId} transactionId={transactionId} transferId={item.transfer_id} label={item.label} returnHref={returnHref} />}</div><DossierNavigation protectedPersonId={protectedPersonId} current="operations" /><section className="mt-5 max-w-4xl rounded-xl border border-[#E2E8F0] bg-white p-5">{closed && <p className="mb-4 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-[#64748B]"><LockKeyhole size={15} />Exercice clôturé — consultation uniquement</p>}<dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs font-semibold text-[#64748B]">Libellé</dt><dd className="font-bold">{item.label}</dd></div><div><dt className="text-xs font-semibold text-[#64748B]">Montant</dt><dd className="font-bold">{formatCurrency(item.amount)}</dd></div><div><dt className="text-xs font-semibold text-[#64748B]">Date</dt><dd>{formatFinancialDate(item.transaction_date)}</dd></div><div><dt className="text-xs font-semibold text-[#64748B]">Compte</dt><dd>{item.account.account_name}</dd></div>{item.counterpartAccount && <div><dt className="text-xs font-semibold text-[#64748B]">Compte de contrepartie</dt><dd>{item.counterpartAccount.account_name}</dd></div>}</dl><Link href={returnHref} className="button button-secondary mt-4">Retour au compte</Link></section></PrivateShell>;
}
