"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createProtectedPersonAction } from "../actions";
import { initialProtectedPersonState } from "../state";
import { FieldError, FormMessage, SubmitButton } from "@/components/auth/form-controls";

export function ProtectedPersonForm() {
  const [state, action] = useActionState(createProtectedPersonAction, initialProtectedPersonState);
  return (
    <form action={action} className="space-y-7">
      <fieldset><legend className="text-lg font-bold">Identité</legend><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field id="firstName" label="Prénom" required errors={state.fieldErrors?.firstName} />
        <Field id="lastName" label="Nom" required errors={state.fieldErrors?.lastName} />
        <Field id="birthName" label="Nom de naissance" errors={state.fieldErrors?.birthName} />
        <Field id="birthDate" label="Date de naissance" type="date" errors={state.fieldErrors?.birthDate} />
      </div></fieldset>
      <fieldset><legend className="text-lg font-bold">Coordonnées</legend><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field id="addressLine1" label="Adresse" errors={state.fieldErrors?.addressLine1} /></div>
        <div className="sm:col-span-2"><Field id="addressLine2" label="Complément" errors={state.fieldErrors?.addressLine2} /></div>
        <Field id="postalCode" label="Code postal" autoComplete="postal-code" errors={state.fieldErrors?.postalCode} />
        <Field id="city" label="Commune" autoComplete="address-level2" errors={state.fieldErrors?.city} />
      </div></fieldset>
      <FormMessage state={state} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/dossiers" className="button button-secondary">Annuler</Link>
        <div className="sm:min-w-40"><SubmitButton pendingLabel="Création…">Créer le dossier</SubmitButton></div>
      </div>
    </form>
  );
}

function Field({ id, label, type = "text", required = false, autoComplete, errors }: { id: string; label: string; type?: string; required?: boolean; autoComplete?: string; errors?: string[] }) {
  return <div><label className="auth-label" htmlFor={id}>{label}{required ? " *" : ""}</label><input className="auth-input" id={id} name={id} type={type} required={required} autoComplete={autoComplete} aria-invalid={Boolean(errors?.length)} /><FieldError messages={errors} /></div>;
}
