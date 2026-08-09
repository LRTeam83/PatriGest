import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, FilePenLine, Landmark, TrendingUp } from "lucide-react";
import { z } from "zod";
import { PrivateShell } from "@/components/layout/private-shell";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { CloseAccountForm, ReopenAccountForm, ValuationForm } from "@/domains/financial-accounts/components/account-actions";
import { getFinancialAccount } from "@/domains/financial-accounts/services/financial-account-service";
import { financialAccountLabels, formatCurrency, formatFinancialDate, getCurrentAccountValue, isValuationAccount } from "@/domains/financial-accounts/utils/financial-account-utils";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";
import { transactionTypeLabels } from "@/domains/transactions/utils/transaction-utils";

export const metadata: Metadata = { title: "Fiche compte" };
export const dynamic = "force-dynamic";

export default async function FinancialAccountDetailPage({ params }: { params: Promise<{ protectedPersonId: string; accountId: string }> }) {
  const { protectedPersonId, accountId } = await params;
  if (![protectedPersonId, accountId].every((id) => z.uuid().safeParse(id).success)) notFound();
  const [person, account] = await Promise.all([getProtectedPerson(protectedPersonId), getFinancialAccount(accountId)]);
  if (!person || !account || account.protected_person_id !== protectedPersonId) notFound();
  const current = getCurrentAccountValue(account, account.valuations, account.transactions);
  const minimumClosingDate = [account.initial_balance_date, account.opening_date].filter((value): value is string => Boolean(value)).sort().at(-1) ?? account.initial_balance_date;
  return <PrivateShell current="dossiers">
    <AppBreadcrumb items={[{ label: "Tableau de bord", href: "/tableau-de-bord" }, { label: `${person.first_name} ${person.last_name}`, href: `/dossiers/${protectedPersonId}` }, { label: "Comptes et patrimoine", href: `/dossiers/${protectedPersonId}/comptes` }, { label: account.account_name }]} />
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">{person.first_name} {person.last_name}</p><h1 className="mt-2 text-3xl font-bold">{account.account_name}</h1><p className="mt-2 text-[#64748B]">{account.institution_name}</p></div><Link href={`/dossiers/${protectedPersonId}/comptes/${accountId}/modifier`} className="button button-secondary gap-2"><FilePenLine aria-hidden="true" size={17} />Modifier</Link></div>
    <DossierNavigation protectedPersonId={protectedPersonId} current="accounts" />
    <div className="mt-8 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-[#E2E8F0] bg-white p-6"><Landmark className="text-[#2563EB]" size={22} /><p className="mt-4 text-sm text-[#64748B]">Solde actuel calculé</p><p className="mt-1 text-3xl font-bold">{formatCurrency(current.value)}</p>{current.valuation && <p className="mt-1 text-xs text-[#94A3B8]">Valorisation au {formatFinancialDate(current.valuation.valuation_date)}</p>}</section><section className="rounded-2xl border border-[#E2E8F0] bg-white p-6"><h2 className="text-lg font-bold">Informations</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Data label="Type" value={financialAccountLabels[account.account_type]} /><Data label="Statut" value={account.status === "active" ? "Actif" : "Clôturé"} /><Data label="Solde initial" value={formatCurrency(account.initial_balance)} /><Data label="Date du solde" value={formatFinancialDate(account.initial_balance_date)} />{account.opening_date && <Data label="Date d’ouverture" value={formatFinancialDate(account.opening_date)} />}{account.account_reference && <Data label="Référence" value={account.account_reference} />}{account.closing_date && <Data label="Date de clôture" value={formatFinancialDate(account.closing_date)} />}</dl></section></div>
    <section className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Dernières opérations</h2><Link href={`/dossiers/${protectedPersonId}/operations?account=${accountId}`} className="text-sm font-semibold text-[#2563EB]">Voir le journal</Link></div>{account.transactions.length ? <div className="mt-4 divide-y divide-[#E2E8F0]">{account.transactions.slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold">{item.label}</p><p className="text-xs text-[#64748B]">{formatFinancialDate(item.transaction_date)} · {transactionTypeLabels[item.transaction_type]}</p></div><p className="font-bold">{item.transaction_type === "income" || item.transaction_type === "transfer_in" ? "+" : "−"}{formatCurrency(item.amount)}</p></div>)}</div> : <p className="mt-3 text-sm text-[#64748B]">Aucune opération enregistrée.</p>}</section>
    {isValuationAccount(account.account_type) && <section className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6"><div className="flex items-center gap-3"><TrendingUp className="text-[#0EA5E9]" size={21} /><h2 className="text-xl font-bold">Valorisations</h2></div>{account.valuations.map((valuation) => <div key={valuation.id} className="mt-4 flex justify-between text-sm"><span>{formatFinancialDate(valuation.valuation_date)}</span><strong>{formatCurrency(valuation.value)}</strong></div>)}<details className="mt-6"><summary className="button button-secondary cursor-pointer list-none">Ajouter une valorisation</summary><ValuationForm protectedPersonId={protectedPersonId} accountId={accountId} /></details></section>}
    <section className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white p-6"><div className="flex items-center gap-3"><CalendarDays className="text-[#EA580C]" size={20} /><h2 className="text-lg font-bold">Cycle de vie du compte</h2></div><div className="mt-5">{account.status === "active" ? <CloseAccountForm protectedPersonId={protectedPersonId} accountId={accountId} accountName={account.account_name} minimumDate={minimumClosingDate} /> : <ReopenAccountForm protectedPersonId={protectedPersonId} accountId={accountId} accountName={account.account_name} />}</div></section>
  </PrivateShell>;
}
function Data({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</dt><dd className="mt-1 text-[#334155]">{value}</dd></div>; }
