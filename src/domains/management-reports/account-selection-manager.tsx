"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/auth/form-controls";
import { financialAccountLabels, formatFinancialDate } from "@/domains/financial-accounts/utils/financial-account-utils";
import type { FinancialAccountType } from "@/types/database";
import { setManagementReportAccountSelectionAction } from "./actions";
import { initialManagementReportStatusState } from "./state";

export type AccountSelectionView = {
  accountId: string;
  name: string;
  type: FinancialAccountType;
  openingDate: string | null;
  closingDate: string | null;
  included: boolean;
  presentAtPeriodStart: boolean;
  presentAtPeriodEnd: boolean;
  selectionSource: "auto" | "manual";
  automaticReason: "active_during_period" | "opened_after_period" | "closed_before_period";
  manualMode: "included_manual" | "excluded_manual" | null;
  manualReason: string | null;
};

const automaticLabels = {
  active_during_period: "Actif pendant tout ou partie de la période",
  opened_after_period: "Ouvert après la période",
  closed_before_period: "Clôturé avant la période",
} as const;

export function AccountSelectionManager({
  personId,
  reportId,
  accounts,
  canManage,
}: {
  personId: string;
  reportId: string;
  accounts: AccountSelectionView[];
  canManage: boolean;
}) {
  return (
    <section className="rounded-xl border bg-white p-4">
      <h2 className="font-bold">Comptes et placements retenus</h2>
      <p className="mt-1 text-xs text-slate-500">
        La règle automatique repose sur les dates d’ouverture et de clôture. Toute exception doit être justifiée.
      </p>
      <div className="mt-2 divide-y">
        {accounts.map((account) => (
          <SelectionRow
            key={account.accountId}
            personId={personId}
            reportId={reportId}
            account={account}
            canManage={canManage}
          />
        ))}
      </div>
    </section>
  );
}

function SelectionRow({ personId, reportId, account, canManage }: {
  personId: string;
  reportId: string;
  account: AccountSelectionView;
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState(
    setManagementReportAccountSelectionAction.bind(null, personId, reportId),
    initialManagementReportStatusState,
  );
  return (
    <div className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold">{account.name}</p>
          <p className="text-[11px] text-slate-500">
            {financialAccountLabels[account.type]} · Ouverture {account.openingDate ? formatFinancialDate(account.openingDate) : "non renseignée"} · Clôture {account.closingDate ? formatFinancialDate(account.closingDate) : "non renseignée"}
          </p>
          <p className="mt-1 text-xs">
            <span className={account.included ? "font-semibold text-emerald-700" : "font-semibold text-slate-500"}>
              {account.included ? "Inclus" : "Exclu"} {account.selectionSource === "manual" ? "manuellement" : "automatiquement"}
            </span>
            <span className="text-slate-500"> · {automaticLabels[account.automaticReason]}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Présence : début {account.presentAtPeriodStart ? "oui" : "non"} · fin {account.presentAtPeriodEnd ? "oui" : "non"}
          </p>
          {account.manualReason && <p className="mt-1 text-[11px] italic text-slate-600">{account.manualReason}</p>}
        </div>
      </div>
      {canManage && (
        <form action={action} className="mt-2 grid gap-2 sm:grid-cols-[12rem_minmax(12rem,1fr)_auto] sm:items-end">
          <input type="hidden" name="financialAccountId" value={account.accountId} />
          <label>
            <span className="auth-label">Règle</span>
            <select className="auth-input" name="selectionMode" defaultValue={account.manualMode ?? "auto"}>
              <option value="auto">Règle automatique</option>
              <option value="included_manual">Inclure malgré la règle</option>
              <option value="excluded_manual">Exclure du compte de gestion</option>
            </select>
          </label>
          <label>
            <span className="auth-label">Justification de l’exception</span>
            <input className="auth-input" name="reason" maxLength={2000} defaultValue={account.manualReason ?? ""} placeholder="Obligatoire pour une inclusion ou exclusion manuelle" />
          </label>
          <button className="button button-secondary" disabled={pending}>{pending ? "Enregistrement…" : "Appliquer"}</button>
          <div className="sm:col-span-3"><FormMessage state={state} /></div>
        </form>
      )}
    </div>
  );
}
