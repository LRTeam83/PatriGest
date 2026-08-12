"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { FormMessage } from "@/components/auth/form-controls";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { deleteTransactionAction, deleteTransferAction } from "../actions";
import { initialTransactionState } from "../state";

export function TransactionDeleteButton({ personId, transactionId, transferId, label, returnHref }: { personId: string; transactionId: string; transferId?: string; label: string; returnHref: string }) {
  const [open, setOpen] = useState(false);
  const action = transferId ? deleteTransferAction.bind(null, personId, transferId) : deleteTransactionAction.bind(null, personId, transactionId);
  const [state, formAction] = useActionState(action, initialTransactionState);
  const router = useRouter();
  useEffect(() => { if (state.status === "success") { router.push(returnHref); router.refresh(); } }, [returnHref, router, state.status]);
  return <><button type="button" className="button button-danger gap-1.5" onClick={() => setOpen(true)}><Trash2 size={15} />Supprimer</button><AppConfirmDialog open={open} onClose={() => setOpen(false)} title={transferId ? "Supprimer ce virement ?" : "Supprimer cette opération ?"} description={transferId ? "Les deux mouvements liés seront supprimés ensemble. Cette action est impossible dans un exercice clôturé." : "Cette action est impossible dans un exercice clôturé."} subject={label} actions={<button className="button button-danger" type="submit" form={`delete-${transactionId}`}>{transferId ? "Supprimer le virement" : "Supprimer l’opération"}</button>}><form id={`delete-${transactionId}`} action={formAction}><FormMessage state={state} /></form></AppConfirmDialog></>;
}
