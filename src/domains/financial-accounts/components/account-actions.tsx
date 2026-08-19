"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormMessage, SubmitButton } from "@/components/auth/form-controls";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import type { AccountValuation } from "@/types/database";
import { closeFinancialAccountAction, createAccountValuationAction, deleteFinancialAccountAction, reopenFinancialAccountAction, updateAccountValuationAction } from "../actions";
import { initialFinancialAccountState } from "../state";

export function CloseAccountForm({ protectedPersonId, accountId, accountName, minimumDate }: { protectedPersonId: string; accountId: string; accountName: string; minimumDate: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(closeFinancialAccountAction.bind(null, protectedPersonId, accountId), initialFinancialAccountState);

  return <><button type="button" className="button button-secondary" onClick={() => setOpen(true)}>Clôturer le compte</button><form action={action}><AppConfirmDialog open={open && state.status !== "success"} title="Clôturer ce compte ?" description="Le compte restera consultable mais ne sera plus inclus dans le patrimoine actif." subject={accountName} onClose={() => setOpen(false)} actions={<DialogSubmitButton pendingLabel="Clôture…">Clôturer le compte</DialogSubmitButton>}><div className="space-y-3"><div><label className="auth-label" htmlFor="closingDate">Date de clôture</label><input className="auth-input" id="closingDate" name="closingDate" type="date" min={minimumDate} required /></div><FormMessage state={state} /></div></AppConfirmDialog></form></>;
}

export function ReopenAccountForm({ protectedPersonId, accountId, accountName }: { protectedPersonId: string; accountId: string; accountName: string }) {
  const [open, setOpen] = useState(false);

  return <><button type="button" className="button button-primary" onClick={() => setOpen(true)}>Rouvrir le compte</button><form action={reopenFinancialAccountAction.bind(null, protectedPersonId, accountId)}><AppConfirmDialog open={open} title="Réouvrir ce compte ?" description="Le compte redeviendra actif et sera réintégré au patrimoine." subject={accountName} onClose={() => setOpen(false)} actions={<DialogSubmitButton pendingLabel="Réouverture…" success>Réouvrir le compte</DialogSubmitButton>} /></form></>;
}

export function DeleteAccountForm({ protectedPersonId, accountId, accountName }: { protectedPersonId: string; accountId: string; accountName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(deleteFinancialAccountAction.bind(null, protectedPersonId, accountId), initialFinancialAccountState);
  return <><button type="button" className="text-xs font-semibold text-[#B91C1C] hover:underline" onClick={() => setOpen(true)}>Supprimer le compte</button><form action={action}><AppConfirmDialog open={open} title="Supprimer ce compte ?" description="Cette action n’est possible que si le compte ne contient plus aucune opération, aucun virement, aucune valorisation ni aucun justificatif." subject={accountName} onClose={() => setOpen(false)} actions={<DialogSubmitButton pendingLabel="Suppression…" destructive>Supprimer le compte</DialogSubmitButton>}><FormMessage state={state} /></AppConfirmDialog></form></>;
}

function DialogSubmitButton({ children, pendingLabel, success = false, destructive = false }: { children: React.ReactNode; pendingLabel: string; success?: boolean; destructive?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={`button ${destructive ? "button-danger" : success ? "bg-[#16A34A] text-white hover:bg-green-700" : "button-primary"}`} disabled={pending}>{pending ? pendingLabel : children}</button>;
}

export function ValuationForm({ protectedPersonId, accountId }: { protectedPersonId: string; accountId: string }) {
  const [state, action] = useActionState(createAccountValuationAction.bind(null, protectedPersonId, accountId), initialFinancialAccountState);
  return <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2"><div><label className="auth-label" htmlFor="valuationDate">Date</label><input className="auth-input" id="valuationDate" name="valuationDate" type="date" required /></div><div><label className="auth-label" htmlFor="value">Valeur</label><input className="auth-input" id="value" name="value" type="number" min="0" step="0.01" required /></div><div className="sm:col-span-2"><label className="auth-label" htmlFor="comment">Commentaire facultatif</label><input className="auth-input" id="comment" name="comment" /></div><div className="sm:col-span-2"><FormMessage state={state} /></div><div className="sm:col-span-2 sm:w-48"><SubmitButton pendingLabel="Ajout…">Ajouter</SubmitButton></div></form>;
}

export function EditValuationButton({ protectedPersonId, accountId, valuation }: { protectedPersonId: string; accountId: string; valuation: AccountValuation }) {
  const [dialogKey, setDialogKey] = useState(0);
  const [open, setOpen] = useState(false);

  function openDialog() {
    setDialogKey((key) => key + 1);
    setOpen(true);
  }

  return <><button type="button" className="text-xs font-semibold text-[#2563EB] hover:underline" onClick={openDialog}>Modifier</button>{open && <EditValuationDialog key={dialogKey} protectedPersonId={protectedPersonId} accountId={accountId} valuation={valuation} onClose={() => setOpen(false)} />}</>;
}

function EditValuationDialog({ protectedPersonId, accountId, valuation, onClose }: { protectedPersonId: string; accountId: string; valuation: AccountValuation; onClose: () => void }) {
  const [state, action] = useActionState(updateAccountValuationAction.bind(null, protectedPersonId, accountId, valuation.id), initialFinancialAccountState);

  return <form action={action}><AppConfirmDialog open={state.status !== "success"} title="Modifier la valorisation" description="Corrigez la date, la valeur ou le commentaire de cette valorisation." onClose={onClose} actions={<DialogSubmitButton pendingLabel="Modification…">Enregistrer</DialogSubmitButton>}><div className="grid gap-3 sm:grid-cols-2"><div><label className="auth-label" htmlFor={`valuationDate-${valuation.id}`}>Date</label><input className="auth-input" id={`valuationDate-${valuation.id}`} name="valuationDate" type="date" defaultValue={valuation.valuation_date} required /></div><div><label className="auth-label" htmlFor={`valuationValue-${valuation.id}`}>Valeur</label><input className="auth-input" id={`valuationValue-${valuation.id}`} name="value" type="number" min="0" step="0.01" defaultValue={valuation.value} required /></div><div className="sm:col-span-2"><label className="auth-label" htmlFor={`valuationComment-${valuation.id}`}>Commentaire facultatif</label><input className="auth-input" id={`valuationComment-${valuation.id}`} name="comment" defaultValue={valuation.comment ?? ""} /></div><div className="sm:col-span-2"><FormMessage state={state} /></div></div></AppConfirmDialog></form>;
}
