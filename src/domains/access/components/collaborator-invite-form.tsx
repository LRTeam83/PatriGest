"use client";
import { useActionState, useState } from "react";
import { Check, Copy } from "lucide-react";
import { SubmitButton } from "@/components/auth/form-controls";
import { inviteCollaboratorAction } from "@/domains/access/actions";
import { initialAccessState } from "@/domains/access/state";
export function CollaboratorInviteForm({ protectedPersonId, isOwner }: { protectedPersonId: string; isOwner: boolean }) {
  const [state, action] = useActionState(inviteCollaboratorAction.bind(null, protectedPersonId), initialAccessState);
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    if (!state.invitationUrl) return;
    await navigator.clipboard.writeText(state.invitationUrl);
    setCopied(true);
  }
  return <form action={action} className="mt-4 grid gap-3 sm:grid-cols-[1fr_12rem_auto]"><div><label className="auth-label" htmlFor="invite-email">Adresse email</label><input className="auth-input" id="invite-email" name="email" type="email" required /></div><div>{isOwner ? <><label className="auth-label" htmlFor="invite-role">Rôle</label><select className="auth-input" id="invite-role" name="role" defaultValue="read_only"><option value="read_only">Lecture seule</option><option value="manager">Gestionnaire</option></select></> : <><p className="auth-label">Rôle</p><input type="hidden" name="role" value="read_only" /><p className="auth-input flex items-center bg-slate-50 text-[#475569]">Lecture seule</p></>}</div><div className="self-end"><SubmitButton pendingLabel="Envoi…">Inviter</SubmitButton></div>{state.message && <p role={state.status === "error" ? "alert" : "status"} aria-live="polite" className={`sm:col-span-3 rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : state.status === "warning" ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-700"}`}>{state.message}</p>}{state.invitationUrl && <div className="sm:col-span-3"><label className="auth-label" htmlFor="invitation-url">Lien à transmettre</label><div className="flex flex-col gap-2 sm:flex-row"><input id="invitation-url" className="auth-input" readOnly value={state.invitationUrl} /><button className="button button-secondary shrink-0 gap-1.5" type="button" onClick={copyLink}>{copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}{copied ? "Lien copié" : "Copier le lien"}</button></div></div>}</form>;
}
