import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type AppBreadcrumbItem = { label: string; href?: string };

export function AppBreadcrumb({ items }: { items: AppBreadcrumbItem[] }) {
  return <nav className="mb-5 min-w-0 overflow-hidden" aria-label="Fil d’Ariane">
    <ol className="flex min-w-0 items-center gap-1 text-xs font-semibold text-[#64748B] sm:text-sm">
      {items.map((item, index) => {
        const current = index === items.length - 1;
        return <li key={`${item.label}-${index}`} className={`flex min-w-0 items-center gap-1 ${current ? "flex-1" : "shrink-[2]"}`}>
          {index > 0 && <ChevronRight aria-hidden="true" className="shrink-0 text-[#CBD5E1]" size={14} />}
          {current || !item.href ? <span className="truncate text-[#334155]" aria-current={current ? "page" : undefined} title={item.label}>{item.label}</span> : <Link href={item.href} className="focus-ring truncate rounded hover:text-[#2563EB]" title={item.label}>{item.label}</Link>}
        </li>;
      })}
    </ol>
  </nav>;
}
