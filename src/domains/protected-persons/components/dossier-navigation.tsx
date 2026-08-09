import Link from "next/link";
import { ArrowLeftRight, CalendarRange, LayoutGrid, WalletCards } from "lucide-react";

export function DossierNavigation({ protectedPersonId, current }: { protectedPersonId: string; current: "overview" | "measure" | "accounts" | "operations" | "periods" }) {
  const items = [
    { key: "accounts", label: "Comptes et patrimoine", href: `/dossiers/${protectedPersonId}/comptes`, icon: WalletCards },
    { key: "operations", label: "Opérations", href: `/dossiers/${protectedPersonId}/operations`, icon: ArrowLeftRight },
    { key: "periods", label: "Exercices de gestion", href: `/dossiers/${protectedPersonId}/exercices`, icon: CalendarRange },
    { key: "overview", label: "Informations du dossier", href: `/dossiers/${protectedPersonId}`, icon: LayoutGrid },
  ] as const;
  return <nav className="mt-7 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_6px_18px_rgba(15,23,42,0.04)] lg:hidden" aria-label="Navigation du dossier"><p className="px-2 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Dans ce dossier</p><div className="flex gap-2 overflow-x-auto pb-0.5">{items.map((item) => { const Icon = item.icon; return <Link key={item.key} href={item.href} aria-current={current === item.key ? "page" : undefined} className={`focus-ring flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${current === item.key ? "bg-blue-50 text-[#2563EB]" : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]"}`}><Icon aria-hidden="true" size={17} />{item.label}</Link>; })}</div></nav>;
}
