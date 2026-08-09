"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import {
  getApplicationOrigin,
  getPasswordRecoveryRedirectUrl,
  getSafeNextPath,
} from "@/lib/auth/redirects";
import type { AuthActionState } from "@/lib/auth/state";
import { createClient } from "@/lib/supabase/server";
import { markSignupInvitationUsed, validateSignupInvitation } from "@/domains/access/actions";

const emailSchema = z.email("Saisissez une adresse email valide.").trim();
const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(72, "Le mot de passe ne peut pas dépasser 72 caractères.");
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Saisissez votre mot de passe.") });
const signupSchema = z.object({
  email: emailSchema,
  firstName: z.string().trim().min(1, "Saisissez votre prénom.").max(80),
  lastName: z.string().trim().min(1, "Saisissez votre nom.").max(80),
  password: passwordSchema,
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["passwordConfirmation"],
});
const resetPasswordSchema = z.object({ email: emailSchema });
const updatePasswordSchema = z.object({
  password: passwordSchema,
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["passwordConfirmation"],
});

function validationError(error: z.ZodError): AuthActionState {
  return { status: "error", message: "Vérifiez les informations saisies.", fieldErrors: error.flatten().fieldErrors };
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: getAuthErrorMessage(error, "Connexion impossible. Vérifiez vos informations et réessayez.") };
  }
  redirect(getSafeNextPath(typeof formData.get("next") === "string" ? String(formData.get("next")) : null, "/tableau-de-bord"));
}

export async function signupAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const invitationToken = z.string().min(32).safeParse(formData.get("invitationToken"));
  if (!invitationToken.success) return { status: "error", message: "Cette invitation est invalide ou a expiré." };
  const invitation = await validateSignupInvitation(invitationToken.data);
  if (!invitation) return { status: "error", message: "Cette invitation est invalide ou a expiré." };
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!parsed.success) return validationError(parsed.error);
  if (parsed.data.email.toLowerCase() !== invitation.email.toLowerCase()) return { status: "error", message: "Utilisez l’adresse email associée à cette invitation." };

  const origin = await getApplicationOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback${invitation.kind === "dossier" ? `?next=${encodeURIComponent(`/invitation/${invitationToken.data}`)}` : ""}`,
      data: { first_name: parsed.data.firstName, last_name: parsed.data.lastName },
    },
  });
  if (error) {
    return { status: "error", message: getAuthErrorMessage(error, "Impossible de créer le compte. Réessayez dans quelques instants.") };
  }
  if (invitation.kind === "account") await markSignupInvitationUsed(invitationToken.data);
  return { status: "success", message: "Votre compte a été créé. Consultez votre messagerie et confirmez votre adresse email avant de vous connecter." };
}

export async function forgotPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return validationError(parsed.error);

  const redirectTo = await getPasswordRecoveryRedirectUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });
  if (error?.code === "over_email_send_rate_limit") {
    return { status: "error", message: getAuthErrorMessage(error, "Réessayez dans quelques minutes.") };
  }
  return { status: "success", message: "Si un compte correspond à cette adresse, un email de réinitialisation vient d’être envoyé." };
}

export async function updatePasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password"), passwordConfirmation: formData.get("passwordConfirmation") });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    return { status: "error", message: "Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouvel email." };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { status: "error", message: getAuthErrorMessage(error, "Impossible de modifier le mot de passe. Demandez un nouveau lien.") };
  }
  return { status: "success", message: "Votre mot de passe a bien été modifié. Redirection en cours…", redirectTo: "/tableau-de-bord" };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
