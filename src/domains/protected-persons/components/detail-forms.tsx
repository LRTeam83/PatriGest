"use client";

import { useActionState } from "react";
import { addManagementPeriodAction, addProtectionMeasureAction } from "../actions";
import { measureTypes } from "../schemas/protection-measure-schema";
import { initialProtectedPersonState } from "../state";
import { FieldError, FormMessage, SubmitButton } from "@/components/auth/form-controls";

export function ProtectionMeasureForm({ protectedPersonId }: { protectedPersonId: string }) {
  const actionWithId = addProtectionMeasureAction.bind(null, protectedPersonId);
  const [state, action] = useActionState(actionWithId, initialProtectedPersonState);
  return <form action={action} className="mt-5 space-y-4 border-t border-[#E2E8F0] pt-5">
    <div><label className="auth-label" htmlFor="measureType">Type de mesure</label><select className="auth-input" id="measureType" name="measureType" required defaultValue=""><option value="" disabled>Choisir une mesure</option>{measureTypes.map((measure) => <option key={measure.value} value={measure.value}>{measure.label}</option>)}</select><FieldError messages={state.fieldErrors?.measureType} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><DateField id="startDate" label="Date de début" errors={state.fieldErrors?.startDate} /><DateField id="decisionDate" label="Date de décision" errors={state.fieldErrors?.decisionDate} /></div>
    <FormMessage state={state} /><SubmitButton pendingLabel="Ajout…">Ajouter la mesure</SubmitButton>
  </form>;
}

export function ManagementPeriodForm({ protectedPersonId }: { protectedPersonId: string }) {
  const year = new Date().getFullYear();
  const actionWithId = addManagementPeriodAction.bind(null, protectedPersonId);
  const [state, action] = useActionState(actionWithId, initialProtectedPersonState);
  return <form action={action} className="mt-5 space-y-4 border-t border-[#E2E8F0] pt-5">
    <div className="grid gap-4 sm:grid-cols-2"><DateField id="startDate" label="Date de début" required defaultValue={`${year}-01-01`} errors={state.fieldErrors?.startDate} /><DateField id="endDate" label="Date de fin" required defaultValue={`${year}-12-31`} errors={state.fieldErrors?.endDate} /></div>
    <FormMessage state={state} /><SubmitButton pendingLabel="Création…">Créer l’exercice</SubmitButton>
  </form>;
}

function DateField({ id, label, required, defaultValue, errors }: { id: string; label: string; required?: boolean; defaultValue?: string; errors?: string[] }) {
  return <div><label className="auth-label" htmlFor={id}>{label}</label><input className="auth-input" id={id} name={id} type="date" required={required} defaultValue={defaultValue} aria-invalid={Boolean(errors?.length)} /><FieldError messages={errors} /></div>;
}
