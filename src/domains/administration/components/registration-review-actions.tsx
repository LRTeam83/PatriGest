"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { resendApplicationActivationEmailAction, reviewApplicationRegistrationAction } from "../actions";
import { initialRegistrationReviewState } from "../state";

export function RegistrationReviewActions({ userId, email }: { userId: string; email: string }) {
  const [decision, setDecision] = useState<"active" | "rejected" | null>(null);
  const [state, action] = useActionState(reviewApplicationRegistrationAction, initialRegistrationReviewState);

  if (state.status === "success" || state.status === "warning") {
    return <div className="max-w-sm text-left" aria-live="polite">
      <p className={`text-xs font-semibold ${state.status === "warning" ? "text-amber-700" : "text-green-700"}`} role="status">{state.message}</p>
      {state.decision === "active" && <ResendActivationEmailButton userId={userId} />}
    </div>;
  }

  return <div>
    <span className="mb-2 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">En attente</span>
    <div className="flex flex-wrap gap-2">
      <button className="button button-primary" type="button" onClick={() => setDecision("active")}>Autoriser l’accès</button>
      <button className="button button-secondary" type="button" onClick={() => setDecision("rejected")}>Refuser</button>
    </div>
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="decision" value={decision ?? ""} />
      <AppConfirmDialog
        open={decision !== null}
        title={decision === "active" ? "Autoriser l’accès à PatriGest ?" : "Refuser cette inscription ?"}
        description={decision === "active" ? "Le compte pourra accéder à PatriGest et un e-mail d’activation sera envoyé." : "Le compte sera conservé, mais ne pourra accéder à aucune donnée métier."}
        subject={email}
        onClose={() => setDecision(null)}
        actions={<ReviewSubmit label={decision === "active" ? "Autoriser l’accès" : "Refuser"} />}
      >
        {state.status === "error" && <p className="text-sm font-semibold text-red-700" role="alert" aria-live="polite">{state.message}</p>}
      </AppConfirmDialog>
    </form>
  </div>;
}

export function ResendActivationEmailButton({ userId }: { userId: string }) {
  const [state, action] = useActionState(resendApplicationActivationEmailAction, initialRegistrationReviewState);
  return <form action={action} className="mt-2">
    <input type="hidden" name="userId" value={userId} />
    <ResendSubmit />
    {state.message && <p className={`mt-1 text-xs font-semibold ${state.status === "error" ? "text-red-700" : "text-green-700"}`} role={state.status === "error" ? "alert" : "status"} aria-live="polite">{state.message}</p>}
  </form>;
}

function ReviewSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Traitement…" : label}</button>;
}

function ResendSubmit() {
  const { pending } = useFormStatus();
  return <button type="submit" className="text-xs font-semibold text-[#2563EB] hover:underline disabled:opacity-60" disabled={pending}>{pending ? "Envoi…" : "Renvoyer l’e-mail d’activation"}</button>;
}
