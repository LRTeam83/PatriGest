"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { FormMessage } from "@/components/auth/form-controls";
import { formatCurrency, formatFinancialDate } from "@/domains/financial-accounts/utils/financial-account-utils";
import { deleteTransactionAction, deleteTransferAction } from "../actions";
import type { TransactionJournalItem } from "../services/transaction-service";
import { initialTransactionState } from "../state";
import { transactionTypeLabels } from "../utils/transaction-utils";
import { isDateInClosedPeriod } from "../utils/transaction-utils";
import type { ManagementPeriod } from "@/types/database";

export function TransactionJournal({ personId, items, periods }: { personId: string; items: TransactionJournalItem[]; periods: ManagementPeriod[] }) {
  if (!items.length) return <section className="mt-6 rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center"><h2 className="text-xl font-bold">Aucune opération</h2><p className="mt-2 text-sm text-[#64748B]">Ajoutez la première opération de ce dossier.</p></section>;
  return <><div className="mt-6 hidden overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white md:block"><table className="w-full text-left text-sm"><thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#64748B]"><tr><th className="p-3">Date</th><th>Compte</th><th>Libellé</th><th>Catégorie</th><th>Dépense</th><th>Recette</th><th>Mouvement</th><th className="pr-3">Actions</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{items.map((item) => <Row key={item.id} item={item} personId={personId} closed={isDateInClosedPeriod(item.transaction_date, periods)} />)}</tbody></table></div><div className="mt-6 space-y-3 md:hidden">{items.map((item) => <Card key={item.id} item={item} personId={personId} closed={isDateInClosedPeriod(item.transaction_date, periods)} />)}</div></>;
}

function Row({ item, personId, closed }: { item: TransactionJournalItem; personId: string; closed: boolean }) {
  const transfer = item.transaction_type === "transfer_in" || item.transaction_type === "transfer_out";
  return <tr><td className="p-3 whitespace-nowrap">{formatFinancialDate(item.transaction_date)}</td><td>{item.account.account_name}</td><td className="max-w-44 truncate font-semibold">{item.label}</td><td>{item.category?.name ?? "—"}</td><td className="font-semibold text-[#DC2626]">{item.transaction_type === "expense" ? formatCurrency(item.amount) : "—"}</td><td className="font-semibold text-[#16A34A]">{item.transaction_type === "income" ? formatCurrency(item.amount) : "—"}</td><td><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{transactionTypeLabels[item.transaction_type]}</span>{transfer && <span className={`mt-1 block whitespace-nowrap text-xs font-bold ${item.transaction_type === "transfer_in" ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{item.transaction_type === "transfer_in" ? "+" : "−"}{formatCurrency(item.amount)}</span>}</td><td className="pr-3">{closed ? <ClosedBadge /> : <Actions item={item} personId={personId} />}</td></tr>;
}

function Card({ item, personId, closed }: { item: TransactionJournalItem; personId: string; closed: boolean }) {
  const positive = item.transaction_type === "income" || item.transaction_type === "transfer_in";
  return <article className="rounded-2xl border border-[#E2E8F0] bg-white p-5"><div className="flex justify-between gap-4"><div><p className="font-bold">{item.label}</p><p className="mt-1 text-xs text-[#64748B]">{formatFinancialDate(item.transaction_date)} · {item.account.account_name}</p></div><p className={`font-bold ${positive ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{positive ? "+" : "−"}{formatCurrency(item.amount)}</p></div><div className="mt-4 flex items-center justify-between"><span className="text-xs text-[#64748B]">{transactionTypeLabels[item.transaction_type]} · {item.category?.name ?? "Sans catégorie"}</span>{closed ? <ClosedBadge /> : <Actions item={item} personId={personId} />}</div></article>;
}

function ClosedBadge() { return <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-[#64748B]">Exercice clôturé</span>; }

function Actions({ item, personId }: { item: TransactionJournalItem; personId: string }) {
  const [open, setOpen] = useState(false);
  const transfer = Boolean(item.transfer_id);
  const action = transfer ? deleteTransferAction.bind(null, personId, item.transfer_id!) : deleteTransactionAction.bind(null, personId, item.id);
  const [state, formAction] = useActionState(action, initialTransactionState);
  return <div className="flex items-center gap-1">{!transfer && <Link href={`/dossiers/${personId}/operations/${item.id}/modifier`} className="focus-ring rounded-lg p-2 text-[#64748B] hover:bg-slate-100" aria-label={`Modifier ${item.label}`}><Pencil size={16} /></Link>}<button type="button" onClick={() => setOpen(true)} className="focus-ring rounded-lg p-2 text-[#DC2626] hover:bg-red-50" aria-label={`Supprimer ${item.label}`}><Trash2 size={16} /></button><AppConfirmDialog open={open} onClose={() => setOpen(false)} title={transfer ? "Supprimer ce virement ?" : "Supprimer cette opération ?"} description={transfer ? "Les deux mouvements liés seront supprimés ensemble. Cette action est impossible dans un exercice clôturé." : "Cette action est impossible dans un exercice clôturé."} subject={item.label} actions={<button className="button button-danger" type="submit" form={`delete-${item.id}`}>{transfer ? "Supprimer le virement" : "Supprimer l’opération"}</button>}><form id={`delete-${item.id}`} action={formAction}><FormMessage state={state} /></form></AppConfirmDialog></div>;
}
