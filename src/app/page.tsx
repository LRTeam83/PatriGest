import { ChartNoAxesCombined, Landmark, ShieldCheck } from "lucide-react";
import { FeatureCard } from "@/components/marketing/feature-card";
import { HeroDashboardPreview } from "@/components/marketing/hero-dashboard-preview";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";
import { APP_NAME, APP_SLOGAN } from "@/lib/app";

const features = [
  {
    title: "Tableau de bord intuitif",
    description:
      "Retrouvez immédiatement les informations essentielles de vos dossiers.",
    icon: ChartNoAxesCombined,
    iconClassName: "bg-blue-50 text-[#2563EB]",
  },
  {
    title: "Comptes et patrimoine",
    description:
      "Suivez simplement comptes courants, livrets, assurances-vie et autres placements.",
    icon: Landmark,
    iconClassName: "bg-sky-50 text-[#0EA5E9]",
  },
  {
    title: "Sécurité des données",
    description:
      "Chaque utilisateur dispose d’un espace privé avec des données strictement isolées.",
    icon: ShieldCheck,
    iconClassName: "bg-green-50 text-[#16A34A]",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden bg-white" aria-labelledby="hero-title">
          <div className="decorative-blob left-[-7rem] top-24 h-56 w-56 bg-sky-100" />
          <div className="decorative-blob right-[-5rem] top-10 h-48 w-48 bg-emerald-100" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-24">
            <div className="relative z-10 max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[#2563EB]">
                <ShieldCheck aria-hidden="true" size={16} />
                Gestion patrimoniale simplifiée
              </div>
              <h1 id="hero-title" className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {APP_NAME}
              </h1>
              <p className="mt-5 text-xl font-semibold leading-8 text-[#2563EB] sm:text-2xl">
                {APP_SLOGAN}
              </p>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#64748B] sm:text-lg">
                Suivez les comptes, les placements et les opérations d’une personne protégée dans un espace simple, clair et sécurisé.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a className="button button-secondary" href="/connexion">Se connecter</a>
                <a className="button button-primary" href="/demande-acces">Créer un compte</a>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#64748B]" aria-label="Avantages">
                {["Simple", "Sécurisé", "Confidentiel"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-green-50 text-[#16A34A]" aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <HeroDashboardPreview />
          </div>
        </section>

        <section id="fonctionnalites" className="scroll-mt-24 py-16 sm:py-20" aria-labelledby="features-title">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2563EB]">L’essentiel au même endroit</p>
              <h2 id="features-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Une gestion claire au quotidien</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-20" aria-labelledby="simple-title">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-7 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#EA580C]">
                  <ChartNoAxesCombined aria-hidden="true" size={22} />
                </div>
                <div>
                  <h2 id="simple-title" className="text-2xl font-bold">Pensé pour rester simple</h2>
                  <p className="mt-3 max-w-3xl leading-7 text-[#64748B]">
                    {APP_NAME} ne cherche pas à devenir un logiciel de comptabilité complexe. L’application est conçue pour faciliter la saisie des relevés, le suivi du patrimoine et la préparation des états de gestion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
