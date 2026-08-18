"use client";

import { useActionState, useEffect, useState } from "react";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { formatFinancialDate } from "@/domains/financial-accounts/utils/financial-account-utils";
import { declareManagementReportTransmissionAction } from "./actions";
import { initialManagementReportStatusState } from "./state";
import type {
  ManagementReportStatus,
  ManagementReportTransmission,
  ManagementReportTransmissionMethod,
} from "@/types/database";

const methodLabels: Record<ManagementReportTransmissionMethod, string> = {
  postal_mail: "Courrier postal",
  hand_delivery: "Remise en main propre",
  email: "Email",
  external_platform: "Plateforme externe",
  other: "Autre",
};

export function ReportTransmission({
  personId,
  reportId,
  status,
  finalizedAt,
  transmission,
  canManage,
}: {
  personId: string;
  reportId: string;
  status: ManagementReportStatus;
  finalizedAt: string | null;
  transmission: ManagementReportTransmission | null;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const canDeclare = status === "finalized" && canManage;
  const canCorrect = status === "transmitted" && canManage && transmission;

  return (
    <section className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Transmission</h2>
          {transmission ? (
            <dl className="mt-2 grid gap-x-5 gap-y-1 text-xs sm:grid-cols-2">
              <div><dt className="text-[#64748B]">Date</dt><dd className="font-semibold">{formatFinancialDate(transmission.transmission_date)}</dd></div>
              <div><dt className="text-[#64748B]">Mode</dt><dd className="font-semibold">{methodLabels[transmission.transmission_method]}</dd></div>
              <div><dt className="text-[#64748B]">Destinataire</dt><dd className="font-semibold">{transmission.recipient}</dd></div>
              {transmission.note && <div className="sm:col-span-2"><dt className="text-[#64748B]">Note</dt><dd className="whitespace-pre-wrap">{transmission.note}</dd></div>}
            </dl>
          ) : (
            <p className="mt-1 text-xs text-[#64748B]">Aucune transmission déclarée.</p>
          )}
        </div>
        {(canDeclare || canCorrect) && (
          <button type="button" className="button button-primary" onClick={() => setOpen(true)}>
            {canDeclare ? "Déclarer comme transmis" : "Modifier la déclaration"}
          </button>
        )}
      </div>
      {open && (
        <TransmissionDialog
          personId={personId}
          reportId={reportId}
          finalizedAt={finalizedAt}
          transmission={transmission}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

function TransmissionDialog({
  personId,
  reportId,
  finalizedAt,
  transmission,
  onClose,
}: {
  personId: string;
  reportId: string;
  finalizedAt: string | null;
  transmission: ManagementReportTransmission | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(
    declareManagementReportTransmissionAction.bind(null, personId, reportId),
    initialManagementReportStatusState,
  );
  const formId = `transmission-${reportId}`;
  useEffect(() => {
    if (state.status === "success") onClose();
  }, [state.status, onClose]);

  return (
    <AppConfirmDialog
      open
      onClose={onClose}
      title={transmission ? "Modifier la déclaration de transmission" : "Déclarer le compte de gestion comme transmis ?"}
      description="Cette action enregistre dans PatriGest que le compte de gestion a été transmis par un moyen extérieur à l’application. PatriGest ne réalise pas l’envoi du document."
      actions={<button className="button button-primary" type="submit" form={formId} disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer la transmission"}</button>}
    >
      <form id={formId} action={action} className="grid gap-3">
        <label><span className="auth-label">Date de transmission *</span><input className="auth-input" name="transmissionDate" type="date" min={finalizedAt?.slice(0, 10)} max={new Date().toISOString().slice(0, 10)} defaultValue={transmission?.transmission_date ?? new Date().toISOString().slice(0, 10)} required /></label>
        <label><span className="auth-label">Mode de transmission *</span><select className="auth-input" name="transmissionMethod" defaultValue={transmission?.transmission_method ?? "postal_mail"} required>{Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span className="auth-label">Destinataire *</span><input className="auth-input" name="recipient" defaultValue={transmission?.recipient ?? ""} maxLength={500} required /></label>
        <label><span className="auth-label">Note (facultative)</span><textarea className="auth-input min-h-20 py-2" name="note" defaultValue={transmission?.note ?? ""} maxLength={5000} /></label>
        {state.message && <p role="alert" className={`rounded-lg px-3 py-2 text-xs ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{state.message}</p>}
      </form>
    </AppConfirmDialog>
  );
}
