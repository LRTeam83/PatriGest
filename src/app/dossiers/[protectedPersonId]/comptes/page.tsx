import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Landmark, Plus, WalletCards } from "lucide-react";
import { PrivateShell } from "@/components/layout/private-shell";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";
import { DossierNavigation } from "@/domains/protected-persons/components/dossier-navigation";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";
import { getFinancialAccounts, type FinancialAccountWithValuations } from "@/domains/financial-accounts/services/financial-account-service";
import { financialAccountLabels, formatCurrency, formatFinancialDate, getCurrentAccountValue, getCurrentPatrimonyValue } from "@/domains/financial-accounts/utils/financial-account-utils";

export const metadata: Metadata = { title: "Comptes et patrimoine" };
export const dynamic = "force-dynamic";

export default async function FinancialAccountsPage({ params }: { params: Promise<{ protectedPersonId: string }> }) {
  const { protectedPersonId } = await params;
  if (!z.uuid().safeParse(protectedPersonId).success) notFound();
  const person = await getProtectedPerson(protectedPersonId);
  if (!person) notFound();
  const accounts = await getFinancialAccounts(protectedPersonId);
  const active = accounts.filter((account) => account.status === "active");
  const closed = accounts.filter((account) => account.status === "closed");
  const total = getCurrentPatrimonyValue(accounts);
  return <PrivateShell current="dossiers"><AppBreadcrumb items={[{ label: "Tableau de bord", href: "/tableau-de-bord" }, { label: `${person.first_name} ${person.last_name}`, href: `/dossiers/${protectedPersonId}` }, { label: "Comptes et patrimoine" }]} /><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2563EB]">{person.first_name} {person.last_name}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Comptes et patrimoine</h1></div><Link href={`/dossiers/${protectedPersonId}/comptes/nouveau`} className="button button-primary gap-2"><Plus aria-hidden="true" size={18} />Ajouter un compte</Link></div><DossierNavigation protectedPersonId={protectedPersonId} current="accounts" />
    <div className="mt-8 grid gap-5 sm:grid-cols-2"><section className="rounded-2xl border border-blue-100 bg-blue-50 p-6"><WalletCards className="text-[#2563EB]" aria-hidden="true" size={22} /><p className="mt-4 text-sm font-semibold text-[#64748B]">Patrimoine total actif</p><p className="mt-1 text-3xl font-bold">{formatCurrency(total)}</p></section><section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6"><Landmark className="text-[#16A34A]" aria-hidden="true" size={22} /><p className="mt-4 text-sm font-semibold text-[#64748B]">Comptes actifs</p><p className="mt-1 text-3xl font-bold">{active.length}</p></section></div>
    {accounts.length === 0 ? <section className="mt-8 rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center"><h2 className="text-xl font-bold">Aucun compte enregistré</h2><p className="mt-2 text-[#64748B]">Ajoutez le premier support financier de ce dossier.</p><Link href={`/dossiers/${protectedPersonId}/comptes/nouveau`} className="button button-primary mt-6">Ajouter un compte</Link></section> : <><AccountSection title="Comptes actifs" accounts={active} protectedPersonId={protectedPersonId} />{closed.length > 0 && <AccountSection title="Comptes clôturés" accounts={closed} protectedPersonId={protectedPersonId} muted />}</>}
  </PrivateShell>;
}

function AccountSection({ title, accounts, protectedPersonId, muted = false }: { title: string; accounts: FinancialAccountWithValuations[]; protectedPersonId: string; muted?: boolean }) {
  if (!accounts.length) return null;
  return <section className="mt-10"><h2 className="text-xl font-bold">{title}</h2><div className="mt-5 grid gap-5 md:grid-cols-2">{accounts.map((account) => { const current = getCurrentAccountValue(account, account.valuations); return <Link key={account.id} href={`/dossiers/${protectedPersonId}/comptes/${account.id}`} className={`focus-ring rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:border-blue-200 ${muted ? "opacity-70" : ""}`}><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold">{account.account_name}</h3><p className="mt-1 text-sm text-[#64748B]">{account.institution_name}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${account.status === "active" ? "bg-green-50 text-[#15803D]" : "bg-slate-100 text-[#64748B]"}`}>{account.status === "active" ? "Actif" : "Clôturé"}</span></div><p className="mt-5 text-sm font-semibold text-[#2563EB]">{financialAccountLabels[account.account_type]}</p><p className="mt-2 text-2xl font-bold">{formatCurrency(current.value)}</p>{current.valuation && <p className="mt-1 text-xs text-[#94A3B8]">Valorisation au {formatFinancialDate(current.valuation.valuation_date)}</p>}</Link>; })}</div></section>;
}
