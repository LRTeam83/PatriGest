import Link from "next/link";
import { ShieldCheck } from "lucide-react";

type AuthShellProps = { title: string; description: string; children: React.ReactNode };

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC] px-5 py-10">
      <div className="decorative-blob -left-20 top-20 h-52 w-52 bg-sky-100" />
      <div className="decorative-blob -right-16 bottom-20 h-48 w-48 bg-emerald-100" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="focus-ring mx-auto mb-7 flex w-fit items-center gap-2.5 rounded-xl" aria-label="PatriGest, retour à l’accueil">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-sm"><ShieldCheck aria-hidden="true" size={23} /></span>
          <span className="text-xl font-bold">PatriGest</span>
        </Link>
        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
          </div>
          <div className="mt-7">{children}</div>
        </section>
      </div>
    </main>
  );
}
