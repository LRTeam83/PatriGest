import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Connexion - PatriGest" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const params = await searchParams;
  const hasCallbackError = params.erreur === "confirmation";
  return (
    <AuthShell title="Se connecter" description="Accédez à votre espace PatriGest sécurisé.">
      <LoginForm initialState={hasCallbackError ? { status: "error", message: "Le lien de confirmation est invalide ou a expiré. Demandez un nouvel email." } : undefined} />
    </AuthShell>
  );
}
