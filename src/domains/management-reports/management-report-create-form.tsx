"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/auth/form-controls";
import type { ManagementPeriod } from "@/types/database";
import { createManagementReportAction } from "./actions";
import { initialManagementReportStatusState } from "./state";

export function ManagementReportCreateForm({
  personId,
  suggested,
}: {
  personId: string;
  suggested: ManagementPeriod | null;
}) {
  const [state, action, pending] = useActionState(
    createManagementReportAction.bind(null, personId),
    initialManagementReportStatusState,
  );
  return (
    <form action={action} className="mt-4 grid gap-2 rounded-xl border bg-white p-4 sm:grid-cols-4">
      <input type="hidden" name="managementPeriodId" value={suggested?.id ?? ""} />
      <div>
        <label className="auth-label">Début</label>
        <input className="auth-input" type="date" name="periodStart" required readOnly={Boolean(suggested)} defaultValue={suggested?.start_date} />
      </div>
      <div>
        <label className="auth-label">Fin</label>
        <input className="auth-input" type="date" name="periodEnd" required readOnly={Boolean(suggested)} defaultValue={suggested?.end_date} />
      </div>
      <div>
        <label className="auth-label">Année</label>
        <input className="auth-input" type="number" name="reportYear" required readOnly={Boolean(suggested)} defaultValue={suggested ? Number(suggested.end_date.slice(0, 4)) : new Date().getUTCFullYear()} />
      </div>
      <button className="button button-primary self-end" disabled={pending}>
        {pending ? "Préparation…" : "Préparer un compte de gestion"}
      </button>
      {suggested && (
        <p className="text-[11px] text-slate-500 sm:col-span-4">
          Les dates reprennent l’exercice de gestion sélectionné et doivent rester identiques.
        </p>
      )}
      <div className="sm:col-span-4"><FormMessage state={state} /></div>
    </form>
  );
}
