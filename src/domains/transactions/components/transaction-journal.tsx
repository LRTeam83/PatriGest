"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { FormMessage } from "@/components/auth/form-controls";
import { formatCurrency, formatFinancialDate, isValuationAccount } from "@/domains/financial-accounts/utils/financial-account-utils";
import { deleteTransactionAction, deleteTransferAction } from "../actions";
import type { TransactionJournalItem } from "../services/transaction-service";
import { initialTransactionState } from "../state";
import { transactionTypeLabels } from "../utils/transaction-utils";
import { isDateInClosedPeriod } from "../utils/transaction-utils";
import type { DossierAccessRole, ManagementPeriod } from "@/types/database";

export function TransactionJournal({ personId, items, periods, accessRole }: { personId: string; items: TransactionJournalItem[]; periods: ManagementPeriod[]; accessRole: DossierAccessRole }) {
  const canManage = accessRole !== "read_only";
  if (!items.length) return <section className="mt-4 rounded-xl border border-dashed border-[#CBD5E1] bg-white p-6 text-center"><h2 className="text-lg font-bold">Aucune opération</h2><p className="mt-1 text-xs text-[#64748B]">Ajoutez la première opération de ce dossier.</p></section>;
  return <><div className="mt-4 hidden overflow-hidden rounded-xl border border-[#E2E8F0] bg-white md:block"><table className="w-full text-left text-xs"><thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#64748B]"><tr><th className="px-2 py-2">Date</th><th className="px-2 py-2">Compte</th><th className="px-2 py-2">Libellé</th><th className="px-2 py-2">Catégorie</th><th className="px-2 py-2">Dépense</th><th className="px-2 py-2">Recette</th><th className="w-20 px-2 py-2">Mouvement</th><th className="w-28 px-2 py-2">Actions</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{items.map((item) => <Row key={item.id} item={item} personId={personId} closed={isDateInClosedPeriod(item.transaction_date, periods)} canManage={canManage} />)}</tbody></table></div><div className="mt-4 space-y-2 md:hidden">{items.map((item) => <Card key={item.id} item={item} personId={personId} closed={isDateInClosedPeriod(item.transaction_date, periods)} canManage={canManage} />)}</div></>;
}

function Row({ item, personId, closed, canManage }: { item: TransactionJournalItem; personId: string; closed: boolean; canManage: boolean }) {
  const transfer = item.transaction_type === "transfer_in" || item.transaction_type === "transfer_out";
  return <tr><td className="whitespace-nowrap px-2 py-2">{formatFinancialDate(item.transaction_date)}</td><td className="max-w-28 truncate px-2 py-2">{item.account.account_name}</td><td className="max-w-40 truncate px-2 py-2 font-semibold">{item.label}</td><td className="max-w-28 truncate px-2 py-2">{item.category?.name ?? "—"}</td><td className="whitespace-nowrap px-2 py-2 font-semibold text-[#DC2626]">{item.transaction_type === "expense" ? formatCurrency(item.amount) : "—"}</td><td className="whitespace-nowrap px-2 py-2 font-semibold text-[#16A34A]">{item.transaction_type === "income" ? formatCurrency(item.amount) : "—"}</td><td className="px-2 py-2"><span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold">{movementLabel(item)}</span>{transfer && <span className={`block whitespace-nowrap text-[10px] font-bold ${item.transaction_type === "transfer_in" ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{item.transaction_type === "transfer_in" ? "+" : "−"}{formatCurrency(item.amount)}</span>}</td><td className="px-2 py-2"><JournalActions item={item} personId={personId} closed={closed} canManage={canManage} /></td></tr>;
}

function Card({ item, personId, closed, canManage }: { item: TransactionJournalItem; personId: string; closed: boolean; canManage: boolean }) {
  const positive = item.transaction_type === "income" || item.transaction_type === "transfer_in";
  return <article className="rounded-xl border border-[#E2E8F0] bg-white p-3.5"><div className="flex justify-between gap-3"><div><p className="text-sm font-bold">{item.label}</p><p className="text-[11px] text-[#64748B]">{formatFinancialDate(item.transaction_date)} · {item.account.account_name}</p></div><p className={`text-sm font-bold ${positive ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{positive ? "+" : "−"}{formatCurrency(item.amount)}</p></div><div className="mt-2.5 flex items-center justify-between gap-2"><span className="text-[11px] text-[#64748B]">{movementLabel(item)} · {item.category?.name ?? "Sans catégorie"}</span><JournalActions item={item} personId={personId} closed={closed} canManage={canManage} /></div></article>;
}

function JournalActions({ item, personId, closed, canManage }: { item: TransactionJournalItem; personId: string; closed: boolean; canManage: boolean }) { const transfer = Boolean(item.transfer_id); const showView = !transfer && (closed || !canManage); return <div className="flex items-center gap-1">{showView && <Link href={`/dossiers/${personId}/operations/${item.id}/modifier`} className="focus-ring rounded-md p-1.5 text-[#2563EB] hover:bg-blue-50" aria-label={`Voir ${item.label}`} title="Voir"><Eye size={14} /></Link>}{closed && <ClosedBadge />}{canManage && !closed && <Actions item={item} personId={personId} />}</div>; }

function movementLabel(item: TransactionJournalItem) {
  if (!item.transfer || !item.counterpartAccount) return transactionTypeLabels[item.transaction_type];
  const accountIsPlacement = isValuationAccount(item.account.account_type);
  const counterpartIsPlacement = isValuationAccount(item.counterpartAccount.account_type);
  if (accountIsPlacement === counterpartIsPlacement) return transactionTypeLabels[item.transaction_type];
  const destinationIsPlacement = isValuationAccount(item.transfer.destination_account_id === item.account.id ? item.account.account_type : item.counterpartAccount.account_type);
  return destinationIsPlacement ? "Versement sur placement" : "Rachat de placement";
}

function ClosedBadge() { return <span className="whitespace-nowrap rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#64748B]" title="Exercice clôturé" aria-label="Exercice clôturé">Clôturé</span>; }

function Actions({ item, personId }: { item: TransactionJournalItem; personId: string }) {
  const [open, setOpen] = useState(false);
  const transfer = Boolean(item.transfer_id);
  const action = transfer ? deleteTransferAction.bind(null, personId, item.transfer_id!) : deleteTransactionAction.bind(null, personId, item.id);
  const [state, formAction] = useActionState(action, initialTransactionState);
  return <div className="flex items-center gap-0.5">{!transfer && <Link href={`/dossiers/${personId}/operations/${item.id}/modifier`} className="focus-ring rounded-md p-1.5 text-[#64748B] hover:bg-slate-100" aria-label={`Modifier ${item.label}`}><Pencil size={14} /></Link>}<button type="button" onClick={() => setOpen(true)} className="focus-ring rounded-md p-1.5 text-[#DC2626] hover:bg-red-50" aria-label={`Supprimer ${item.label}`}><Trash2 size={14} /></button><AppConfirmDialog open={open} onClose={() => setOpen(false)} title={transfer ? "Supprimer ce virement ?" : "Supprimer cette opération ?"} description={transfer ? "Les deux mouvements liés seront supprimés ensemble. Cette action est impossible dans un exercice clôturé." : "Cette action est impossible dans un exercice clôturé."} subject={item.label} actions={<button className="button button-danger" type="submit" form={`delete-${item.id}`}>{transfer ? "Supprimer le virement" : "Supprimer l’opération"}</button>}><form id={`delete-${item.id}`} action={formAction}><FormMessage state={state} /></form></AppConfirmDialog></div>;
}
