import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Créer un compte - PatriGest" };

export default function SignupPage() {
  return <AuthShell title="Créer un compte" description="Quelques informations suffisent pour commencer."><SignupForm /></AuthShell>;
}
