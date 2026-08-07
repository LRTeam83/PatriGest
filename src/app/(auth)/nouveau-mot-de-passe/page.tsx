import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function UpdatePasswordPage() {
  return <AuthShell title="Nouveau mot de passe" description="Choisissez un mot de passe robuste et unique."><UpdatePasswordForm /></AuthShell>;
}
