import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function PublicFooter() {
  return (
    <footer id="aide" className="scroll-mt-24 border-t border-[#E2E8F0] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="max-w-md">
          <div className="flex items-center gap-2.5 font-bold"><ShieldCheck aria-hidden="true" size={22} className="text-[#2563EB]" />PatriGest</div>
          <p className="mt-3 text-sm text-[#64748B]">La gestion des personnes protégées, en toute simplicité.</p>
          <p className="mt-5 text-xs text-[#94A3B8]">© {new Date().getFullYear()} PatriGest. Tous droits réservés.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#64748B]" aria-label="Navigation de pied de page">
          <Link className="focus-ring rounded-md hover:text-[#2563EB]" href="#fonctionnalites">Fonctionnalités</Link>
          <Link className="focus-ring rounded-md hover:text-[#2563EB]" href="#aide">Aide</Link>
          <Link className="focus-ring rounded-md hover:text-[#2563EB]" href="/connexion">Se connecter</Link>
          <Link className="focus-ring rounded-md text-[#EA580C] hover:text-orange-700" href="/inscription">Créer un compte</Link>
        </nav>
      </div>
    </footer>
  );
}
