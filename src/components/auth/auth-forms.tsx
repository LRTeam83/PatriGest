"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  forgotPasswordAction,
  loginAction,
  signupAction,
  updatePasswordAction,
} from "@/app/(auth)/actions";
import { initialAuthState, type AuthActionState } from "@/lib/auth/state";
import { FieldError, FormMessage, SubmitButton } from "./form-controls";

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  errors,
  defaultValue,
  readOnly,
}: {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete: string;
  errors?: string[];
  defaultValue?: string;
  readOnly?: boolean;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label className="auth-label" htmlFor={id}>{label}</label>
      <input className="auth-input" id={id} name={id} type={type} autoComplete={autoComplete} required defaultValue={defaultValue} readOnly={readOnly} aria-invalid={Boolean(errors?.length)} aria-describedby={errors?.length ? errorId : undefined} />
      <div id={errorId}><FieldError messages={errors} /></div>
    </div>
  );
}

export function LoginForm({ initialState = initialAuthState, nextPath }: { initialState?: AuthActionState; nextPath?: string }) {
  const [state, action] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="space-y-4">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <Field id="email" label="Adresse email" type="email" autoComplete="email" errors={state.fieldErrors?.email} />
      <Field id="password" label="Mot de passe" type="password" autoComplete="current-password" errors={state.fieldErrors?.password} />
      <div className="flex justify-end"><Link className="auth-link text-sm" href="/mot-de-passe-oublie">Mot de passe oublié ?</Link></div>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Connexion…">Se connecter</SubmitButton>
      <p className="text-center text-sm text-[#64748B]">Pas encore de compte ? <Link className="auth-link" href="/demande-acces">Demander un accès</Link></p>
      <Link className="auth-back-link" href="/">Retour à l’accueil</Link>
    </form>
  );
}

export function SignupForm({ invitationToken, email, firstName, lastName }: { invitationToken: string; email: string; firstName?: string; lastName?: string }) {
  const [state, action] = useActionState(signupAction, initialAuthState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="invitationToken" value={invitationToken} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="firstName" label="Prénom" autoComplete="given-name" errors={state.fieldErrors?.firstName} defaultValue={firstName} />
        <Field id="lastName" label="Nom" autoComplete="family-name" errors={state.fieldErrors?.lastName} defaultValue={lastName} />
      </div>
      <Field id="email" label="Adresse email" type="email" autoComplete="email" errors={state.fieldErrors?.email} defaultValue={email} readOnly />
      <Field id="password" label="Mot de passe" type="password" autoComplete="new-password" errors={state.fieldErrors?.password} />
      <Field id="passwordConfirmation" label="Confirmation du mot de passe" type="password" autoComplete="new-password" errors={state.fieldErrors?.passwordConfirmation} />
      <p className="text-xs leading-5 text-[#64748B]">Utilisez au moins 8 caractères. Un mot de passe long et unique protège mieux vos données.</p>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Création…">Créer mon compte</SubmitButton>
      <p className="text-center text-sm text-[#64748B]">Déjà inscrit ? <Link className="auth-link" href="/connexion">Se connecter</Link></p>
      <Link className="auth-back-link" href="/">Retour à l’accueil</Link>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialAuthState);
  return (
    <form action={action} className="space-y-4">
      <Field id="email" label="Adresse email" type="email" autoComplete="email" errors={state.fieldErrors?.email} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Envoi…">Envoyer le lien</SubmitButton>
      <Link className="auth-back-link" href="/connexion">Retour à la connexion</Link>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, initialAuthState);
  const router = useRouter();

  useEffect(() => {
    if (!state.redirectTo) return;
    const timeout = window.setTimeout(() => router.replace(state.redirectTo!), 1400);
    return () => window.clearTimeout(timeout);
  }, [router, state.redirectTo]);

  return (
    <form action={action} className="space-y-4">
      <Field id="password" label="Nouveau mot de passe" type="password" autoComplete="new-password" errors={state.fieldErrors?.password} />
      <Field id="passwordConfirmation" label="Confirmation du mot de passe" type="password" autoComplete="new-password" errors={state.fieldErrors?.passwordConfirmation} />
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Modification…">Modifier le mot de passe</SubmitButton>
      <Link className="auth-back-link" href="/connexion">Retour à la connexion</Link>
    </form>
  );
}
