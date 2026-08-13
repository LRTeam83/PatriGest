"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/auth/form-controls";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { deletePlatformUserAction } from "../actions";
import { initialDeleteUserState } from "../state";

export function DeleteUserButton({ userId, name, email }: { userId: string; name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(deletePlatformUserAction.bind(null, userId), initialDeleteUserState);
  const visible = state.status !== "success";
  return <>{visible && <button type="button" className="text-xs font-semibold text-[#B91C1C] hover:underline" onClick={() => setOpen(true)}>Supprimer l’utilisateur</button>}<form action={action}><AppConfirmDialog open={open && visible} title="Supprimer cet utilisateur ?" description="Cette action est définitive. L’utilisateur doit ne posséder aucun dossier et ne disposer d’aucun accès à un dossier." subject={`${name || "Nom non renseigné"} — ${email}`} onClose={() => setOpen(false)} actions={<button type="submit" className="button button-danger">Supprimer l’utilisateur</button>}><FormMessage state={state} /></AppConfirmDialog></form>{state.status === "success" && <p className="text-xs font-semibold text-[#15803D]">Utilisateur supprimé</p>}</>;
}
