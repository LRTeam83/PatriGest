import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0]/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10">
        <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-xl" aria-label="PatriGest, accueil">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm">
            <ShieldCheck aria-hidden="true" size={23} strokeWidth={2.25} />
          </span>
          <span className="text-xl font-bold tracking-tight">PatriGest</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#64748B] md:flex" aria-label="Navigation principale">
          <Link className="focus-ring rounded-md transition-colors hover:text-[#2563EB]" href="#fonctionnalites">Fonctionnalités</Link>
          <Link className="focus-ring rounded-md transition-colors hover:text-[#2563EB]" href="#aide">Aide</Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link className="button button-secondary mobile-hide" href="/connexion">Se connecter</Link>
          <Link className="button button-primary whitespace-nowrap px-4 sm:px-5" href="/inscription">Créer un compte</Link>
        </div>
      </div>
    </header>
  );
}
