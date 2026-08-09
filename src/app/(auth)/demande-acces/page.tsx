import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AccountRequestForm } from "@/domains/access/components/account-request-form";
export const metadata: Metadata = { title: "Demander un accès" };
export default function AccountRequestPage() { return <AuthShell title="Demander un accès" description="Présentez votre demande d’ouverture de compte PatriGest."><AccountRequestForm /></AuthShell>; }
