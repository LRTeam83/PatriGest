import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié - PatriGest" };

export default function ForgotPasswordPage() {
  return <AuthShell title="Mot de passe oublié" description="Recevez un lien sécurisé pour choisir un nouveau mot de passe."><ForgotPasswordForm /></AuthShell>;
}
