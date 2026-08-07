import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

export function FeatureCard({ title, description, icon: Icon, iconClassName }: FeatureCardProps) {
  return (
    <article className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className={`flex size-12 items-center justify-center rounded-xl ${iconClassName}`}>
        <Icon aria-hidden="true" size={22} />
      </div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-3 leading-7 text-[#64748B]">{description}</p>
    </article>
  );
}
