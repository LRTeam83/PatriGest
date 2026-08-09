import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarDays, FolderOpen, Landmark, WalletCards } from "lucide-react";
import { PrivateShell } from "@/components/layout/private-shell";
import { AdministrationDashboard } from "@/domains/administration/components/administration-dashboard";
import { getPrivateAccessContext } from "@/domains/administration/services/private-access-context";
import { getDashboardData, type DashboardTransaction } from "@/domains/dashboard/services/dashboard-service";
import { formatCurrency, formatFinancialDate } from "@/domains/financial-accounts/utils/financial-account-utils";
import { transactionTypeLabels } from "@/domains/transactions/utils/transaction-utils";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { isPlatformAdmin } = await getPrivateAccessContext();
  if (isPlatformAdmin) return <PrivateShell current="dashboard"><AdministrationDashboard /></PrivateShell>;
  const data = await getDashboardData();
  const nextPeriod = data.upcomingPeriods[0];
  return <PrivateShell current="dashboard">
    <header><p className="text-sm font-semibold text-[#64748B]">{data.firstName ? `Bonjour, ${data.firstName}` : "Bonjour"}</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Tableau de bord</h1></header>

    <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Indicateurs principaux">
      <StatCard href="/dossiers" title="Dossiers" value={String(data.activeDossiers)} detail="dossiers actifs" icon={FolderOpen} color="blue" />
      <StatCard href="/dossiers" title="Comptes" value={String(data.activeAccounts)} detail="comptes actifs" icon={Landmark} color="green" />
      <StatCard title="Patrimoine" value={formatCurrency(data.currentPatrimony)} detail="patrimoine actuel" icon={WalletCards} color="violet" />
    </section>

    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Évolution du patrimoine</h2><p className="mt-0.5 text-xs text-[#64748B]">Historique bientôt disponible</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-[#64748B]">12 derniers mois</span></div><div className="mt-4 flex h-20 items-end gap-1.5 overflow-hidden rounded-lg bg-gradient-to-b from-blue-50/40 to-slate-50 px-3 pb-2" aria-hidden="true">{[28,42,35,54,48,66,58,72,64,78,70,84].map((height, index) => <span key={index} className="flex-1 rounded-t bg-blue-100" style={{ height: `${height}%` }} />)}</div><p className="mt-2 text-[11px] leading-4 text-[#94A3B8]">Visuel indicatif — l’historique réel sera disponible prochainement.</p></section>

      <Link href={nextPeriod ? `/dossiers/${nextPeriod.protected_person_id}/exercices` : "/dossiers"} className="focus-ring rounded-2xl border border-amber-100 bg-amber-50/70 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)] transition hover:border-amber-200"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-[#EA580C]"><CalendarDays aria-hidden="true" size={18} /></span><h2 className="text-lg font-bold">À faire prochainement</h2></div>{nextPeriod ? <><div className="mt-4 flex items-end gap-3"><p className="text-3xl font-bold leading-none text-[#EA580C]">{data.upcomingPeriods.length}</p><p className="text-sm font-semibold">{data.upcomingPeriods.length > 1 ? "Comptes de gestion à préparer" : "Compte de gestion à préparer"}</p></div><p className="mt-4 text-xs text-[#64748B]">Échéance la plus proche : <strong className="text-[#334155]">{formatFinancialDate(nextPeriod.end_date)}</strong></p></> : <p className="mt-5 text-sm font-semibold text-[#64748B]">Aucun exercice en cours</p>}</Link>
    </div>

    <section className="mt-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><h2 className="text-lg font-bold">Dernières opérations</h2>{data.recentTransactions.length ? <div className="mt-2 divide-y divide-[#E2E8F0]">{data.recentTransactions.map((transaction) => <RecentTransaction key={transaction.id} transaction={transaction} />)}</div> : <div className="py-6 text-center"><p className="font-semibold">Aucune opération enregistrée</p><p className="mt-1 text-sm text-[#64748B]">Les dernières opérations apparaîtront ici.</p></div>}</section>
  </PrivateShell>;
}

const colors = { blue: "bg-blue-50 text-[#2563EB]", green: "bg-emerald-50 text-[#16A34A]", violet: "bg-violet-50 text-[#7C3AED]" } as const;
function StatCard({ href, title, value, detail, icon: Icon, color }: { href?: string; title: string; value: string; detail: string; icon: typeof FolderOpen; color: keyof typeof colors }) { const content = <div className="flex items-center gap-4"><div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colors[color]}`}><Icon aria-hidden="true" size={18} /></div><div className="min-w-0"><p className="text-xs font-semibold text-[#64748B]">{title}</p><p className="mt-0.5 truncate text-2xl font-bold tracking-tight">{value}</p><p className="text-[11px] text-[#94A3B8]">{detail}</p></div></div>; return href ? <Link href={href} className="focus-ring rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-blue-200">{content}</Link> : <article className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">{content}</article>; }

function RecentTransaction({ transaction }: { transaction: DashboardTransaction }) { const income = transaction.transaction_type === "income"; const expense = transaction.transaction_type === "expense"; const transfer = !income && !expense; const Icon = income ? ArrowDownLeft : expense ? ArrowUpRight : ArrowLeftRight; return <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 py-2.5 sm:grid-cols-[2rem_minmax(0,1fr)_7rem_auto]"><span className={`flex size-8 items-center justify-center rounded-lg ${income ? "bg-emerald-50 text-[#16A34A]" : expense ? "bg-red-50 text-[#DC2626]" : "bg-blue-50 text-[#2563EB]"}`}><Icon aria-hidden="true" size={15} /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{transaction.label}</p><p className="truncate text-[11px] text-[#94A3B8]">{transaction.account.account_name}{transfer ? ` · ${transactionTypeLabels[transaction.transaction_type]}` : ""}</p></div><p className="hidden text-xs text-[#64748B] sm:block">{formatFinancialDate(transaction.transaction_date)}</p><p className={`shrink-0 text-sm font-bold ${income ? "text-[#16A34A]" : expense ? "text-[#DC2626]" : "text-[#2563EB]"}`}>{income || transaction.transaction_type === "transfer_in" ? "+" : "−"} {formatCurrency(transaction.amount)}</p></div>; }
