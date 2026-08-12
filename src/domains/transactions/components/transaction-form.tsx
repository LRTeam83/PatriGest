"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, FinancialAccount, Transaction } from "@/types/database";
import { FieldError, FormMessage, SubmitButton } from "@/components/auth/form-controls";
import { createTransactionAction, createTransferAction, updateTransactionAction } from "../actions";
import { initialTransactionState } from "../state";
import { isValuationAccount } from "@/domains/financial-accounts/utils/financial-account-utils";

type Mode = "income" | "expense" | "transfer";

export function TransactionForm({ personId, accounts, categories, transaction, defaultAccountId, defaultMode }: { personId: string; accounts: FinancialAccount[]; categories: Category[]; transaction?: Transaction; defaultAccountId?: string; defaultMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(transaction?.transaction_type === "income" ? "income" : defaultMode ?? "expense");
  const action = transaction ? updateTransactionAction.bind(null, personId, transaction.id) : mode === "transfer" ? createTransferAction.bind(null, personId) : createTransactionAction.bind(null, personId);
  const [state, formAction] = useActionState(action, initialTransactionState);
  const activeAccounts = accounts.filter((account) => account.status === "active");
  const transactionalAccounts = activeAccounts.filter((account) => !isValuationAccount(account.account_type));
  const usableCategories = categories.filter((category) => category.active && (category.usage === mode || category.usage === "both"));
  const returnHref = defaultAccountId ? `/dossiers/${personId}/comptes/${defaultAccountId}/operations` : `/dossiers/${personId}/operations`;
  useEffect(() => { if (!transaction && mode !== "transfer" && state.status === "success") { router.push(returnHref); router.refresh(); } }, [mode, returnHref, router, state.status, transaction]);

  return <form action={formAction} className="grid gap-3 sm:grid-cols-2">
    {!transaction && <div className="grid grid-cols-3 gap-2 sm:col-span-2" role="group" aria-label="Type d’opération">{([ ["income", "Recette"], ["expense", "Dépense"], ["transfer", "Virement"] ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setMode(value)} className={`button ${mode === value ? "button-primary" : "button-secondary"}`}>{label}</button>)}</div>}
    {mode === "transfer" && !transaction ? <>
      <input type="hidden" name="kind" value="transfer" />
      <DateField name="transferDate" label="Date" errors={state.fieldErrors?.transferDate} />
      <AccountSelect name="sourceAccountId" label="Compte source" accounts={activeAccounts} defaultValue={defaultAccountId} errors={state.fieldErrors?.sourceAccountId} />
      <AccountSelect name="destinationAccountId" label="Compte destination" accounts={activeAccounts} errors={state.fieldErrors?.destinationAccountId} />
      <Field name="amount" label="Montant" type="number" step="0.01" errors={state.fieldErrors?.amount} />
      <Field name="label" label="Libellé facultatif" errors={state.fieldErrors?.label} />
      <Textarea name="comment" label="Commentaire facultatif" />
    </> : <>
      <input type="hidden" name="transactionType" value={transaction?.transaction_type ?? mode} />
      <AccountSelect name="financialAccountId" label={mode === "income" ? "Compte crédité" : "Compte débité"} accounts={transactionalAccounts} defaultValue={transaction?.financial_account_id ?? defaultAccountId} errors={state.fieldErrors?.financialAccountId} />
      <DateField name="transactionDate" label="Date" defaultValue={transaction?.transaction_date} errors={state.fieldErrors?.transactionDate} />
      <Field name="label" label="Libellé" defaultValue={transaction?.label} errors={state.fieldErrors?.label} />
      <Field name="amount" label="Montant" type="number" step="0.01" defaultValue={transaction?.amount} errors={state.fieldErrors?.amount} />
      <div><label className="auth-label" htmlFor="categoryId">Catégorie facultative</label><select className="auth-input" id="categoryId" name="categoryId" defaultValue={transaction?.category_id ?? ""}><option value="">Sans catégorie</option>{usableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
      {mode === "expense" && <div><label className="auth-label" htmlFor="proofReference">Référence du justificatif</label>{transaction?.proof_reference ? <input className="auth-input bg-slate-50 text-[#475569]" id="proofReference" name="proofReference" readOnly value={transaction.proof_reference} /> : <p className="flex min-h-9 items-center rounded-lg bg-blue-50 px-3 text-xs text-[#475569]">Attribuée automatiquement après la création</p>}<input type="hidden" name="proofReference" value={transaction?.proof_reference ?? ""} /></div>}
      {mode === "income" && <input type="hidden" name="proofReference" value="" />}
      <Textarea name="comment" label="Commentaire facultatif" defaultValue={transaction?.comment} />
    </>}
    <div className="sm:col-span-2"><FormMessage state={state} /></div>
    <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end"><Link href={transaction ? `/dossiers/${personId}/operations` : returnHref} className="button button-secondary">Annuler</Link><div className="sm:min-w-40"><SubmitButton pendingLabel="Enregistrement…">{transaction ? "Enregistrer" : mode === "transfer" ? "Créer le virement" : "Ajouter l’opération"}</SubmitButton></div></div>
  </form>;
}

function AccountSelect({ name, label, accounts, defaultValue, errors }: { name: string; label: string; accounts: FinancialAccount[]; defaultValue?: string; errors?: string[] }) { return <div><label className="auth-label" htmlFor={name}>{label} *</label><select className="auth-input" id={name} name={name} required defaultValue={defaultValue ?? ""}><option value="" disabled>Choisir un compte</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name} — {account.institution_name}</option>)}</select><FieldError messages={errors} /></div>; }
function DateField({ name, label, defaultValue, errors }: { name: string; label: string; defaultValue?: string; errors?: string[] }) { return <Field name={name} label={label} type="date" defaultValue={defaultValue ?? new Date().toISOString().slice(0, 10)} errors={errors} />; }
function Field({ name, label, type = "text", step, defaultValue, errors }: { name: string; label: string; type?: string; step?: string; defaultValue?: string | number | null; errors?: string[] }) { return <div><label className="auth-label" htmlFor={name}>{label} *</label><input className="auth-input" id={name} name={name} required={!label.includes("facultati")} type={type} step={step} min={type === "number" ? "0.01" : undefined} defaultValue={defaultValue ?? ""} /><FieldError messages={errors} /></div>; }
function Textarea({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) { return <div className="sm:col-span-2"><label className="auth-label" htmlFor={name}>{label}</label><textarea className="auth-input min-h-20 py-2" id={name} name={name} defaultValue={defaultValue ?? ""} /></div>; }
