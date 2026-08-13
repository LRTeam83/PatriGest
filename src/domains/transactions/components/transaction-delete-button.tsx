"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { FormMessage } from "@/components/auth/form-controls";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { deleteTransactionAction, deleteTransferAction } from "../actions";
import { initialTransactionState } from "../state";

export function TransactionDeleteButton({ personId, transactionId, transferId, label, returnHref }: { personId: string; transactionId: string; transferId?: string; label: string; returnHref: string }) {
  const [open, setOpen] = useState(false);
  const action = transferId ? deleteTransferAction.bind(null, personId, transferId, returnHref) : deleteTransactionAction.bind(null, personId, transactionId, returnHref);
  const [state, formAction] = useActionState(action, initialTransactionState);
  return <><button type="button" className="button button-danger gap-1.5" onClick={() => setOpen(true)}><Trash2 size={15} />Supprimer</button><AppConfirmDialog open={open} onClose={() => setOpen(false)} title={transferId ? "Supprimer ce virement ?" : "Supprimer cette opération ?"} description={transferId ? "Les deux mouvements liés seront supprimés ensemble. Cette action est impossible dans un exercice clôturé." : "Cette action est impossible dans un exercice clôturé."} subject={label} actions={<button className="button button-danger" type="submit" form={`delete-${transactionId}`}>{transferId ? "Supprimer le virement" : "Supprimer l’opération"}</button>}><form id={`delete-${transactionId}`} action={formAction}><FormMessage state={state} /></form></AppConfirmDialog></>;
}
