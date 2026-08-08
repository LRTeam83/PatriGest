import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, History } from "lucide-react";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";
import { APP_NAME, APP_VERSION } from "@/lib/app";
import { APP_RELEASES } from "@/lib/releases";

export const metadata: Metadata = { title: "Historique des versions" };

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

export default function ReleaseHistoryPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#64748B] hover:text-[#2563EB]"><ArrowLeft aria-hidden="true" size={17} />Retour à l’accueil</Link>
        <div className="mt-9">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]"><History aria-hidden="true" size={23} /></div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Historique des versions</h1>
          <p className="mt-3 text-lg text-[#64748B]">Découvrez les nouveautés et évolutions de {APP_NAME}.</p>
        </div>
        <div className="mt-10 space-y-6">
          {APP_RELEASES.map((release) => (
            <article key={release.version} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-[#2563EB]">v{release.version}</span>
                {release.version === APP_VERSION && <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#15803D]">Version actuelle</span>}
                <time dateTime={release.date} className="text-xs text-[#94A3B8]">{dateFormatter.format(new Date(`${release.date}T00:00:00Z`))}</time>
              </div>
              <h2 className="mt-4 text-2xl font-bold">{release.title}</h2>
              <p className="mt-3 leading-7 text-[#64748B]">{release.summary}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {release.changes.map((change) => <li key={change} className="flex gap-2 text-sm text-[#475569]"><Check aria-hidden="true" className="mt-0.5 shrink-0 text-[#16A34A]" size={16} /><span>{change}</span></li>)}
              </ul>
            </article>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
