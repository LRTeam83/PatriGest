import { ArrowDownLeft, ArrowUpRight, Bell, FolderHeart, Landmark, MoreHorizontal } from "lucide-react";
import { APP_NAME } from "@/lib/app";

const operations = [
  { label: "Retraite mensuelle", date: "12 juin", amount: "+ 1 248,40 €", positive: true },
  { label: "Loyer résidence", date: "10 juin", amount: "− 685,00 €", positive: false },
  { label: "Assurance habitation", date: "8 juin", amount: "− 42,80 €", positive: false },
];

export function HeroDashboardPreview() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-2xl" aria-label={`Aperçu visuel du tableau de bord ${APP_NAME}`}>
      <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-blue-100/60" aria-hidden="true" />
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_24px_70px_rgba(37,99,235,0.14)]">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold text-[#64748B]">Bonjour, Marie</p>
            <p className="mt-0.5 font-bold">Tableau de bord</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-[#F8FAFC] text-[#64748B]">
            <Bell aria-hidden="true" size={17} />
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
          <PreviewStat icon={FolderHeart} label="Dossiers" value="3 dossiers" color="blue" />
          <PreviewStat icon={Landmark} label="Comptes" value="8 comptes" color="sky" />
          <div className="rounded-xl bg-[#2563EB] p-4 text-white sm:col-span-1">
            <p className="text-xs font-medium text-blue-100">Patrimoine</p>
            <p className="mt-2 text-lg font-bold">87 652,18 €</p>
            <p className="mt-2 text-xs text-blue-100">+ 2,4 % cette année</p>
          </div>
        </div>
        <div className="grid gap-4 px-4 pb-5 sm:grid-cols-[1.1fr_0.9fr] sm:px-6 sm:pb-6">
          <div className="rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#64748B]">Évolution du patrimoine</p>
                <p className="mt-1 text-sm font-bold">12 derniers mois</p>
              </div>
              <MoreHorizontal aria-hidden="true" size={18} className="text-[#94A3B8]" />
            </div>
            <svg className="mt-4 h-24 w-full" viewBox="0 0 260 90" role="img" aria-label="Graphique décoratif en hausse">
              <path d="M4 74 C36 65, 47 70, 72 52 S116 61, 144 37 S188 46, 212 24 S244 22, 256 8" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
              <path d="M4 74 C36 65, 47 70, 72 52 S116 61, 144 37 S188 46, 212 24 S244 22, 256 8 L256 90 L4 90 Z" fill="#DBEAFE" opacity="0.6" />
            </svg>
          </div>
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
            <p className="text-xs font-semibold text-[#EA580C]">À faire prochainement</p>
            <p className="mt-3 text-2xl font-bold">2</p>
            <p className="mt-1 text-sm leading-5 text-[#64748B]">Comptes de gestion à préparer</p>
          </div>
        </div>
        <div className="border-t border-[#E2E8F0] px-4 py-4 sm:px-6">
          <p className="mb-3 text-sm font-bold">Dernières opérations</p>
          <div className="space-y-3">
            {operations.map((operation) => (
              <div key={operation.label} className="flex items-center gap-3 text-xs">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${operation.positive ? "bg-green-50 text-[#16A34A]" : "bg-slate-100 text-[#64748B]"}`}>
                  {operation.positive ? <ArrowDownLeft aria-hidden="true" size={15} /> : <ArrowUpRight aria-hidden="true" size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{operation.label}</p>
                  <p className="mt-0.5 text-[#94A3B8]">{operation.date}</p>
                </div>
                <p className={`font-bold ${operation.positive ? "text-[#16A34A]" : "text-[#0F172A]"}`}>{operation.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ icon: Icon, label, value, color }: { icon: typeof FolderHeart; label: string; value: string; color: "blue" | "sky" }) {
  const colors = color === "blue" ? "bg-blue-50 text-[#2563EB]" : "bg-sky-50 text-[#0EA5E9]";
  return (
    <div className="rounded-xl border border-[#E2E8F0] p-4">
      <div className={`flex size-8 items-center justify-center rounded-lg ${colors}`}><Icon aria-hidden="true" size={16} /></div>
      <p className="mt-3 text-xs text-[#64748B]">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
