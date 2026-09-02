"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { UserMinus } from "lucide-react";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { removeCollaboratorAction } from "@/domains/access/actions";
import { initialAccessState } from "@/domains/access/state";

export function CollaboratorRemoveButton({
  protectedPersonId,
  accessId,
  collaboratorName,
}: {
  protectedPersonId: string;
  accessId: string;
  collaboratorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(
    removeCollaboratorAction.bind(null, protectedPersonId, accessId),
    initialAccessState,
  );

  return <div>
    <button type="button" className="button button-secondary gap-1.5 text-red-700" onClick={() => setOpen(true)}>
      <UserMinus aria-hidden="true" size={15} />Retirer
    </button>
    <form action={action}>
      <AppConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Retirer l’accès au dossier ?"
        description={`${collaboratorName} ne pourra plus accéder à ce dossier.`}
        actions={<RemoveButton />}
      >
        {state.message && <p role={state.status === "error" ? "alert" : "status"} aria-live="polite" className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{state.message}</p>}
      </AppConfirmDialog>
    </form>
    {state.status === "success" && <p role="status" aria-live="polite" className="mt-2 text-xs font-semibold text-green-700">Accès retiré</p>}
  </div>;
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="button button-danger">{pending ? "Retrait…" : "Retirer l’accès"}</button>;
}
