"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, RefreshCw } from "lucide-react";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { regenerateAccountInvitationAction, reviewAccountRequestAction } from "@/domains/access/actions";
import { initialAccessState, type AccessActionState } from "@/domains/access/state";

export function RequestReviewActions({ id, email }: { id: string; email: string }) {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [state, action] = useActionState(reviewAccountRequestAction, initialAccessState);

  if (state.invitationUrl) return <InvitationLinkResult state={state} />;

  return <div className="flex flex-wrap gap-2">
    <button className="button button-primary" type="button" onClick={() => setDecision("approved")}>Approuver</button>
    <button className="button button-secondary" type="button" onClick={() => setDecision("rejected")}>Refuser</button>
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision ?? ""} />
      <AppConfirmDialog open={decision !== null} title={decision === "approved" ? "Approuver cette demande ?" : "Refuser cette demande ?"} description={decision === "approved" ? "Un lien d’inscription sécurisé et valable sept jours sera créé." : "Aucun compte ne sera créé."} subject={email} onClose={() => setDecision(null)} actions={<Submit label={decision === "approved" ? "Approuver" : "Refuser"} />}>
        {state.message && <p className={`text-sm ${state.status === "error" ? "text-red-700" : "text-green-700"}`}>{state.message}</p>}
      </AppConfirmDialog>
    </form>
  </div>;
}

export function RegenerateAccountInvitation({ id, email, expiresAt }: { id: string; email: string; expiresAt: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(regenerateAccountInvitationAction, initialAccessState);

  if (state.invitationUrl) return <InvitationLinkResult state={state} />;

  return <>
    <div>{expiresAt && <p className="mb-1 text-right text-[11px] text-[#64748B]">Expiration : {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(expiresAt))}</p>}<button className="button button-secondary gap-1.5" type="button" onClick={() => setOpen(true)}><RefreshCw aria-hidden="true" size={14} />Régénérer le lien d’inscription</button></div>
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <AppConfirmDialog open={open} title="Régénérer le lien d’inscription ?" description="L’ancien lien sera immédiatement invalidé et le nouveau sera valable sept jours." subject={email} onClose={() => setOpen(false)} actions={<Submit label="Régénérer le lien" />}>
        {state.message && <p className="text-sm text-red-700">{state.message}</p>}
      </AppConfirmDialog>
    </form>
  </>;
}

function InvitationLinkResult({ state }: { state: AccessActionState }) {
  const [copied, setCopied] = useState(false);
  const url = state.invitationUrl!;
  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setCopied(true); }
    catch { setCopied(false); }
  }

  return <section className="w-full max-w-xl rounded-xl border border-green-200 bg-green-50 p-3" aria-live="polite">
    <p className="flex items-center gap-1.5 text-sm font-bold text-green-800"><Check aria-hidden="true" size={16} />{state.message}</p>
    <p className="mt-1 text-xs font-semibold text-green-800">Lien d’inscription valable 7 jours</p>
    {state.invitationExpiresAt && <p className="mt-0.5 text-[11px] text-green-700">Expiration : {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(state.invitationExpiresAt))}</p>}
    <p className="mt-2 break-all rounded-lg bg-white px-2.5 py-2 text-xs text-[#334155]">{url}</p>
    <button className="button button-secondary mt-2 gap-1.5" type="button" onClick={copyLink}>{copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}{copied ? "Lien copié" : "Copier le lien"}</button>
  </section>;
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Traitement…" : label}</button>;
}
