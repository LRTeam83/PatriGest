"use client";

import { useActionState, useEffect, useState } from "react";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { formatFinancialDate } from "@/domains/financial-accounts/utils/financial-account-utils";
import type {
  ManagementReportApproval,
  ManagementReportDifficulty,
  ManagementReportStatus,
} from "@/types/database";
import {
  declareManagementReportApprovalAction,
  declareManagementReportDifficultyAction,
} from "./actions";
import { initialManagementReportStatusState } from "./state";

type OutcomeKind = "approval" | "difficulty";

export function ReportOutcome({
  personId,
  reportId,
  status,
  transmissionDate,
  approval,
  difficulty,
  canManage,
}: {
  personId: string;
  reportId: string;
  status: ManagementReportStatus;
  transmissionDate: string;
  approval: ManagementReportApproval | null;
  difficulty: ManagementReportDifficulty | null;
  canManage: boolean;
}) {
  const [dialog, setDialog] = useState<OutcomeKind | null>(null);
  const canDeclare = status === "transmitted" && canManage;
  const canCorrectApproval = status === "approved" && Boolean(approval) && canManage;
  const canCorrectDifficulty = status === "difficulty" && Boolean(difficulty) && canManage;

  return (
    <section className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">
            {approval ? "Approbation" : difficulty ? "Difficulté" : "Retour du contrôleur"}
          </h2>
          {approval ? (
            <dl className="mt-2 grid gap-x-5 gap-y-1 text-xs sm:grid-cols-2">
              <Item label="Date" value={formatFinancialDate(approval.approval_date)} />
              <Item label="Contrôleur / organisme" value={approval.reviewer_name} />
              {approval.reviewer_role && <Item label="Qualité / fonction" value={approval.reviewer_role} />}
              {approval.note && <Item label="Note" value={approval.note} wide />}
            </dl>
          ) : difficulty ? (
            <dl className="mt-2 grid gap-x-5 gap-y-1 text-xs sm:grid-cols-2">
              <Item label="Date" value={formatFinancialDate(difficulty.difficulty_date)} />
              {difficulty.recipient && <Item label="Destinataire / autorité" value={difficulty.recipient} />}
              <Item label="Motif" value={difficulty.reason} wide />
              {difficulty.note && <Item label="Note" value={difficulty.note} wide />}
            </dl>
          ) : (
            <p className="mt-1 text-xs text-[#64748B]">Aucun retour enregistré.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canDeclare && (
            <>
              <button type="button" className="button button-primary" onClick={() => setDialog("approval")}>Déclarer comme approuvé</button>
              <button type="button" className="button button-secondary" onClick={() => setDialog("difficulty")}>Signaler une difficulté</button>
            </>
          )}
          {canCorrectApproval && <button type="button" className="button button-secondary" onClick={() => setDialog("approval")}>Modifier l’approbation</button>}
          {canCorrectDifficulty && <button type="button" className="button button-secondary" onClick={() => setDialog("difficulty")}>Modifier le signalement</button>}
        </div>
      </div>
      {dialog === "approval" && (
        <ApprovalDialog personId={personId} reportId={reportId} transmissionDate={transmissionDate} approval={approval} onClose={() => setDialog(null)} />
      )}
      {dialog === "difficulty" && (
        <DifficultyDialog personId={personId} reportId={reportId} transmissionDate={transmissionDate} difficulty={difficulty} onClose={() => setDialog(null)} />
      )}
    </section>
  );
}

function ApprovalDialog({ personId, reportId, transmissionDate, approval, onClose }: { personId: string; reportId: string; transmissionDate: string; approval: ManagementReportApproval | null; onClose: () => void }) {
  const [state, action, pending] = useActionState(declareManagementReportApprovalAction.bind(null, personId, reportId), initialManagementReportStatusState);
  const formId = `approval-${reportId}`;
  useEffect(() => { if (state.status === "success") onClose(); }, [state.status, onClose]);
  return <AppConfirmDialog open onClose={onClose} title={approval ? "Modifier l’approbation" : "Déclarer le compte de gestion comme approuvé ?"} description="Cette action enregistre dans PatriGest l’approbation reçue pour ce compte de gestion. PatriGest ne réalise pas lui-même l’approbation." actions={<button className="button button-primary" type="submit" form={formId} disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer l’approbation"}</button>}><form id={formId} action={action} className="grid gap-3 sm:grid-cols-2"><Field name="approvalDate" label="Date d’approbation *" type="date" min={transmissionDate} max={today()} value={approval?.approval_date} required /><Field name="reviewerName" label="Personne / organisme ayant approuvé *" value={approval?.reviewer_name} maxLength={500} required /><Field name="reviewerRole" label="Qualité / fonction (facultative)" value={approval?.reviewer_role} maxLength={500} /><TextArea name="note" label="Note (facultative)" value={approval?.note} /><Message state={state} /></form></AppConfirmDialog>;
}

function DifficultyDialog({ personId, reportId, transmissionDate, difficulty, onClose }: { personId: string; reportId: string; transmissionDate: string; difficulty: ManagementReportDifficulty | null; onClose: () => void }) {
  const [state, action, pending] = useActionState(declareManagementReportDifficultyAction.bind(null, personId, reportId), initialManagementReportStatusState);
  const formId = `difficulty-${reportId}`;
  useEffect(() => { if (state.status === "success") onClose(); }, [state.status, onClose]);
  return <AppConfirmDialog open onClose={onClose} title={difficulty ? "Modifier le signalement" : "Signaler une difficulté ?"} description="Cette action enregistre un signalement de difficulté associé au compte de gestion transmis." actions={<button className="button button-primary" type="submit" form={formId} disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer le signalement"}</button>}><form id={formId} action={action} className="grid gap-3 sm:grid-cols-2"><Field name="difficultyDate" label="Date *" type="date" min={transmissionDate} max={today()} value={difficulty?.difficulty_date} required /><Field name="recipient" label="Destinataire / autorité (facultatif)" value={difficulty?.recipient} maxLength={500} /><TextArea name="reason" label="Motif *" value={difficulty?.reason} required /><TextArea name="note" label="Note (facultative)" value={difficulty?.note} /><Message state={state} /></form></AppConfirmDialog>;
}

function Item({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) { return <div className={wide ? "sm:col-span-2" : undefined}><dt className="text-[#64748B]">{label}</dt><dd className="whitespace-pre-wrap font-semibold">{value}</dd></div>; }
function Field({ name, label, value, ...props }: { name: string; label: string; value?: string | null } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name" | "value">) { return <label><span className="auth-label">{label}</span><input className="auth-input" name={name} defaultValue={value ?? ""} {...props} /></label>; }
function TextArea({ name, label, value, required = false }: { name: string; label: string; value?: string | null; required?: boolean }) { return <label className="sm:col-span-2"><span className="auth-label">{label}</span><textarea className="auth-input min-h-20 py-2" name={name} defaultValue={value ?? ""} maxLength={5000} required={required} /></label>; }
function Message({ state }: { state: { status: "idle" | "success" | "error"; message: string } }) { return state.message ? <p role="alert" className={`sm:col-span-2 rounded-lg px-3 py-2 text-xs ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{state.message}</p> : null; }
function today() { return new Date().toISOString().slice(0, 10); }
