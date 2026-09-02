"use client";

import { useActionState, useEffect, useRef } from "react";
import { FieldError, FormMessage, SubmitButton } from "@/components/auth/form-controls";
import { updatePasswordAction } from "../actions";
import { initialAccountState } from "../state";

export function PasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, initialAccountState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);

  return <form ref={formRef} action={action} className="mt-4 space-y-4">
    <PasswordField name="currentPassword" label="Mot de passe actuel" autoComplete="current-password" errors={state.fieldErrors?.currentPassword} />
    <div className="grid gap-4 sm:grid-cols-2">
      <PasswordField name="newPassword" label="Nouveau mot de passe" autoComplete="new-password" errors={state.fieldErrors?.newPassword} />
      <PasswordField name="passwordConfirmation" label="Confirmer le nouveau mot de passe" autoComplete="new-password" errors={state.fieldErrors?.passwordConfirmation} />
    </div>
    <p className="text-xs leading-5 text-[#64748B]">Utilisez entre 8 et 72 caractères. Un mot de passe long et unique protège mieux vos données.</p>
    <FormMessage state={state} />
    <div className="w-full [&_.auth-submit]:whitespace-nowrap [&_.auth-submit]:px-5 sm:w-auto sm:[&_.auth-submit]:w-auto"><SubmitButton pendingLabel="Modification…">Modifier le mot de passe</SubmitButton></div>
  </form>;
}

function PasswordField({ name, label, autoComplete, errors }: { name: string; label: string; autoComplete: string; errors?: string[] }) {
  const errorId = `${name}-error`;
  return <div><label className="auth-label" htmlFor={name}>{label}</label><input className="auth-input" id={name} name={name} type="password" autoComplete={autoComplete} required minLength={name === "currentPassword" ? 1 : 8} maxLength={72} aria-invalid={Boolean(errors?.length)} aria-describedby={errors?.length ? errorId : undefined} /><div id={errorId}><FieldError messages={errors} /></div></div>;
}
