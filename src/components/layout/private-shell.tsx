import { PrivateNavigation, type PrivateDossierContext, type PrivateSection } from "@/components/layout/private-navigation";
import { ReleaseNotice } from "@/components/releases/release-notice";
import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";
import { APP_VERSION } from "@/lib/app";
import { LATEST_RELEASE } from "@/lib/releases";

export async function PrivateShell({ children, current, dossier }: { children: React.ReactNode; current: PrivateSection; dossier?: PrivateDossierContext }) {
  const { supabase, userId } = await getAuthenticatedUser();
  const { data: profile, error } = await supabase.from("profiles").select("last_seen_version").eq("id", userId).maybeSingle();
  if (error) throw new Error("Impossible de vérifier la version lue.");
  const showReleaseNotice = profile?.last_seen_version !== APP_VERSION;

  return <div className="min-h-screen bg-[#F8FAFC] lg:flex">
    <PrivateNavigation current={current} dossier={dossier} />
    <div className="min-w-0 flex-1">
      {showReleaseNotice && <ReleaseNotice release={LATEST_RELEASE} />}
      <main className="private-content mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 xl:px-10">{children}</main>
    </div>
  </div>;
}
