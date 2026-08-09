import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { APP_NAME } from "@/lib/app";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; next?: string }>;
}) {
  const params = await searchParams;
  const hasCallbackError = params.erreur === "confirmation";
  return (
    <AuthShell title="Se connecter" description={`Accédez à votre espace ${APP_NAME} sécurisé.`}>
      <LoginForm nextPath={params.next} initialState={hasCallbackError ? { status: "error", message: "Le lien de confirmation est invalide ou a expiré. Demandez un nouvel email." } : undefined} />
    </AuthShell>
  );
}
