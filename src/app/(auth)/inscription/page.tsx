import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/auth-forms";
import { validateSignupInvitation } from "@/domains/access/actions";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const invitation = token ? await validateSignupInvitation(token) : null;
  if (!token || !invitation) return <AuthShell title="Invitation requise" description="L’inscription à PatriGest est accessible uniquement sur invitation."><p className="text-sm leading-6 text-[#64748B]">Cette invitation est invalide ou a expiré. Vous pouvez demander un accès depuis la page publique.</p></AuthShell>;
  return <AuthShell title="Créer un compte" description="Votre invitation a été vérifiée."><SignupForm invitationToken={token} email={invitation.email} firstName={invitation.first_name} lastName={invitation.last_name} /></AuthShell>;
}
