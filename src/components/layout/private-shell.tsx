import Link from "next/link";
import { FolderOpen, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { APP_NAME, APP_VERSION } from "@/lib/app";

export function PrivateShell({ children, current }: { children: React.ReactNode; current: "dashboard" | "dossiers" }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/tableau-de-bord" className="focus-ring flex items-center gap-2.5 rounded-xl" aria-label={`${APP_NAME}, tableau de bord`}>
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white"><ShieldCheck aria-hidden="true" size={22} /></span>
            <span className="text-xl font-bold">{APP_NAME}</span>
          </Link>
          <nav className="order-3 flex w-full items-center gap-2 sm:order-2 sm:w-auto" aria-label="Navigation privée">
            <PrivateLink href="/tableau-de-bord" active={current === "dashboard"} icon={LayoutDashboard}>Tableau de bord</PrivateLink>
            <PrivateLink href="/dossiers" active={current === "dossiers"} icon={FolderOpen}>Dossiers</PrivateLink>
          </nav>
          <form className="order-2 sm:order-3" action={logoutAction}>
            <button className="button button-secondary gap-2 px-3 sm:px-5" type="submit"><LogOut aria-hidden="true" size={17} /><span className="hidden sm:inline">Déconnexion</span></button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">{children}</main>
      <footer className="mx-auto flex w-full max-w-6xl flex-col px-5 pb-6 text-xs text-[#94A3B8] sm:px-8">
        <span>{APP_NAME}</span>
        <span>v{APP_VERSION}</span>
      </footer>
    </div>
  );
}

function PrivateLink({ href, active, icon: Icon, children }: { href: string; active: boolean; icon: typeof LayoutDashboard; children: React.ReactNode }) {
  return <Link href={href} className={`focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors sm:flex-none ${active ? "bg-blue-50 text-[#2563EB]" : "text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]"}`}><Icon aria-hidden="true" size={17} />{children}</Link>;
}
