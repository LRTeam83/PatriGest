"use client";

import { useActionState, type ReactNode } from "react";
import { FormMessage } from "@/components/auth/form-controls";
import { updateManagementReportAction } from "./actions";
import { initialManagementReportStatusState } from "./state";

export function ManagementReportUpdateForm({
  personId,
  reportId,
  editable,
  children,
}: {
  personId: string;
  reportId: string;
  editable: boolean;
  children: ReactNode;
}) {
  const [state, action, pending] = useActionState(
    updateManagementReportAction.bind(null, personId, reportId),
    initialManagementReportStatusState,
  );

  return (
    <form action={action} className="mt-4 space-y-3">
      <fieldset
        disabled={!editable || pending}
        className="space-y-3 disabled:opacity-80"
      >
        {children}
        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            <button className="button button-primary" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <FormMessage state={state} />
          </div>
        )}
      </fieldset>
    </form>
  );
}
