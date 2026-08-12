"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatFinancialDate, isValuationAccount } from "@/domains/financial-accounts/utils/financial-account-utils";
import type { DossierAccessRole, ManagementPeriod } from "@/types/database";
import type { TransactionJournalItem } from "../services/transaction-service";
import { isDateInClosedPeriod, transactionTypeLabels } from "../utils/transaction-utils";

type Props = {
  personId: string;
  items: TransactionJournalItem[];
  periods: ManagementPeriod[];
  accessRole: DossierAccessRole;
  accountRegister?: boolean;
  balances?: ReadonlyMap<string, number>;
};

export function TransactionJournal({ personId, items, periods, accountRegister = false, balances }: Props) {
  if (!items.length) return <section className="mt-4 rounded-xl border border-dashed border-[#CBD5E1] bg-white p-6 text-center"><h2 className="text-lg font-bold">Aucune opération</h2><p className="mt-1 text-xs text-[#64748B]">Aucune opération ne correspond à cette vue.</p></section>;
  const ordered = [...items].sort((left, right) =>
    right.transaction_date.localeCompare(left.transaction_date)
    || right.created_at.localeCompare(left.created_at)
    || right.id.localeCompare(left.id),
  );
  const headCell = accountRegister ? "px-2.5 py-1.5" : "px-3 py-2";
  return <><div className="mt-3 hidden overflow-hidden rounded-xl border border-[#E2E8F0] bg-white md:block"><table className={`w-full text-left ${accountRegister ? "table-fixed text-[12.5px]" : "text-xs"}`}>{accountRegister && <colgroup><col className="w-[6.5rem]" /><col /><col className="w-[18%]" /><col className="w-[7.5rem]" /><col className="w-[7.5rem]" /><col className="w-[8.75rem]" /></colgroup>}<thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#64748B]"><tr><th className={headCell}>Date</th>{!accountRegister && <th className={headCell}>Compte</th>}<th className={headCell}>Libellé</th><th className={headCell}>Catégorie</th><th className={`${headCell} text-right`}>Dépense</th><th className={`${headCell} text-right`}>Recette</th>{accountRegister && <th className={`${headCell} text-right font-bold text-[#475569]`}>Solde</th>}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{ordered.map((item) => <Row key={item.id} item={item} personId={personId} periods={periods} accountRegister={accountRegister} balance={balances?.get(item.id)} />)}</tbody></table></div><div className={`${accountRegister ? "mt-3 space-y-1.5" : "mt-4 space-y-2"} md:hidden`}>{ordered.map((item) => <Card key={item.id} item={item} personId={personId} periods={periods} accountRegister={accountRegister} balance={balances?.get(item.id)} />)}</div></>;
}

function Row({ item, personId, periods, accountRegister, balance }: { item: TransactionJournalItem; personId: string; periods: ManagementPeriod[]; accountRegister: boolean; balance?: number }) {
  const router = useRouter();
  const href = item.transfer_id ? `/dossiers/${personId}/operations/${item.id}` : `/dossiers/${personId}/operations/${item.id}/modifier`;
  const closed = isDateInClosedPeriod(item.transaction_date, periods);
  const cell = accountRegister ? "px-2.5 py-1.5" : "px-3 py-2.5";
  const open = () => router.push(href);
  return <tr onClick={accountRegister ? open : undefined} onKeyDown={accountRegister ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } } : undefined} tabIndex={accountRegister ? 0 : undefined} role={accountRegister ? "link" : undefined} aria-label={accountRegister ? `Ouvrir l’opération ${item.label}` : undefined} className={accountRegister ? "cursor-pointer transition hover:bg-blue-50/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563EB]" : "transition hover:bg-blue-50/40"}><td className={`whitespace-nowrap ${cell}`}>{formatFinancialDate(item.transaction_date)}</td>{!accountRegister && <td className={`max-w-32 truncate ${cell}`}>{item.account.account_name}</td>}<td className={`truncate font-semibold ${cell}`} title={item.label}>{accountRegister ? item.label : <Link href={href} className="focus-ring rounded-sm text-[#0F172A] hover:text-[#2563EB] hover:underline">{item.label}</Link>}{closed && <ClosedBadge />}{item.transfer_id && <p className="truncate text-[10px] font-medium leading-3 text-[#64748B]">{movementLabel(item)}</p>}</td><td className={`truncate ${cell}`}>{item.category?.name ?? "—"}</td><td className={`whitespace-nowrap text-right font-semibold text-[#DC2626] ${cell}`}>{isDebit(item) ? formatCurrency(item.amount) : "—"}</td><td className={`whitespace-nowrap text-right font-semibold text-[#16A34A] ${cell}`}>{isCredit(item) ? formatCurrency(item.amount) : "—"}</td>{accountRegister && <td className={`whitespace-nowrap text-right font-extrabold tabular-nums text-[#334155] ${cell}`}>{balance === undefined ? "—" : formatCurrency(balance)}</td>}</tr>;
}

function Card({ item, personId, periods, accountRegister, balance }: { item: TransactionJournalItem; personId: string; periods: ManagementPeriod[]; accountRegister: boolean; balance?: number }) {
  const href = item.transfer_id ? `/dossiers/${personId}/operations/${item.id}` : `/dossiers/${personId}/operations/${item.id}/modifier`;
  const closed = isDateInClosedPeriod(item.transaction_date, periods);
  const content = <><div className="flex justify-between gap-3"><div className="min-w-0"><p className="text-[11px] leading-4 text-[#64748B]">{formatFinancialDate(item.transaction_date)}</p><p className="truncate text-[13px] font-bold leading-5">{item.label}</p>{!accountRegister && <p className="truncate text-[11px] text-[#64748B]">{item.account.account_name}</p>}</div><p className={`shrink-0 pt-1 text-[13px] font-bold ${isCredit(item) ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{isCredit(item) ? "+" : "−"}{formatCurrency(item.amount)}</p></div><div className="mt-1.5 flex items-center justify-between gap-2"><span className="truncate text-[11px] text-[#64748B]">{item.category?.name ?? movementLabel(item)}</span><span className="flex shrink-0 items-center gap-1.5">{closed && <ClosedBadge />}{accountRegister && balance !== undefined && <strong className="whitespace-nowrap text-xs font-extrabold tabular-nums text-[#334155]">Solde {formatCurrency(balance)}</strong>}</span></div></>;
  return href ? <Link href={href} className={`focus-ring block rounded-xl border border-[#E2E8F0] bg-white transition hover:border-blue-200 ${accountRegister ? "p-3" : "p-3.5"}`}>{content}</Link> : <article className="rounded-xl border border-[#E2E8F0] bg-white p-3.5">{content}</article>;
}

function isCredit(item: TransactionJournalItem) { return item.transaction_type === "income" || item.transaction_type === "transfer_in"; }
function isDebit(item: TransactionJournalItem) { return item.transaction_type === "expense" || item.transaction_type === "transfer_out"; }

function movementLabel(item: TransactionJournalItem) {
  if (!item.transfer || !item.counterpartAccount) return transactionTypeLabels[item.transaction_type];
  const accountIsPlacement = isValuationAccount(item.account.account_type);
  const counterpartIsPlacement = isValuationAccount(item.counterpartAccount.account_type);
  if (accountIsPlacement === counterpartIsPlacement) return transactionTypeLabels[item.transaction_type];
  const destinationIsPlacement = isValuationAccount(item.transfer.destination_account_id === item.account.id ? item.account.account_type : item.counterpartAccount.account_type);
  return destinationIsPlacement ? "Versement sur placement" : "Rachat de placement";
}

function ClosedBadge() { return <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#64748B]">Clôturé</span>; }
