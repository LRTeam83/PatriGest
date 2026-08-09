"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CalendarPlus, LockKeyhole, Pencil } from "lucide-react";
import type { ManagementPeriod } from "@/types/database";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { FieldError, FormMessage } from "@/components/auth/form-controls";
import { addManagementPeriodAction, closeManagementPeriodAction, updateManagementPeriodAction } from "../actions";
import { initialProtectedPersonState } from "../state";
import { formatFinancialDate } from "@/domains/financial-accounts/utils/financial-account-utils";

export function ManagementPeriodManager({ protectedPersonId, periods }: { protectedPersonId: string; periods: ManagementPeriod[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  return <div className="mt-8"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Tous les exercices</h2><button className="button button-primary gap-2" type="button" onClick={() => setCreateOpen(true)}><CalendarPlus size={17} />Créer un exercice</button></div><div className="mt-4 space-y-3">{periods.length ? periods.map((period) => <PeriodRow key={period.id} protectedPersonId={protectedPersonId} period={period} />) : <p className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center text-[#64748B]">Aucun exercice de gestion.</p>}</div><PeriodDialog protectedPersonId={protectedPersonId} open={createOpen} onClose={() => setCreateOpen(false)} /></div>;
}

function PeriodRow({ protectedPersonId, period }: { protectedPersonId: string; period: ManagementPeriod }) {
  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const open = period.status === "open";
  return <article className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">Du {formatFinancialDate(period.start_date)} au {formatFinancialDate(period.end_date)}</p><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${open ? "bg-green-50 text-[#15803D]" : "bg-slate-100 text-[#64748B]"}`}>{open ? "Ouvert · exercice courant" : "Clôturé"}</span></div>{period.closed_at && <p className="mt-1 text-xs text-[#94A3B8]">Clôturé le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(new Date(period.closed_at))}</p>}</div>{open ? <div className="flex gap-2"><button className="button button-secondary gap-2" type="button" onClick={() => setEditOpen(true)}><Pencil size={15} />Modifier</button><button className="button button-secondary gap-2" type="button" onClick={() => setCloseOpen(true)}><LockKeyhole size={15} />Clôturer</button></div> : <span className="text-xs font-semibold text-[#94A3B8]">Non modifiable</span>}<PeriodDialog protectedPersonId={protectedPersonId} period={period} open={editOpen} onClose={() => setEditOpen(false)} /><AppConfirmDialog open={closeOpen} onClose={() => setCloseOpen(false)} title="Clôturer cet exercice ?" description="La clôture empêchera ensuite la modification et la suppression des opérations comprises dans cette période." subject={`Du ${formatFinancialDate(period.start_date)} au ${formatFinancialDate(period.end_date)}`} actions={<form action={closeManagementPeriodAction.bind(null, protectedPersonId, period.id)}><button className="button button-danger" type="submit">Clôturer l’exercice</button></form>} /></article>;
}

function PeriodDialog({ protectedPersonId, period, open, onClose }: { protectedPersonId: string; period?: ManagementPeriod; open: boolean; onClose: () => void }) {
  const action = period ? updateManagementPeriodAction.bind(null, protectedPersonId, period.id) : addManagementPeriodAction.bind(null, protectedPersonId);
  const [state, formAction] = useActionState(action, initialProtectedPersonState);
  const previousState = useRef(state);
  const formId = `period-${period?.id ?? "new"}`;
  const year = new Date().getFullYear();
  useEffect(() => { if (open && state.status === "success" && previousState.current !== state) onClose(); previousState.current = state; }, [open, state, onClose]);
  return <AppConfirmDialog open={open} onClose={onClose} title={period ? "Modifier l’exercice" : "Créer un exercice"} description="Définissez la période couverte par cet exercice de gestion." actions={<button className="button button-primary" type="submit" form={formId}>{period ? "Enregistrer" : "Créer l’exercice"}</button>}><form id={formId} action={formAction} className="grid gap-4 sm:grid-cols-2"><DateField id={`${formId}-start`} name="startDate" label="Date de début" defaultValue={period?.start_date ?? `${year}-01-01`} errors={state.fieldErrors?.startDate} /><DateField id={`${formId}-end`} name="endDate" label="Date de fin" defaultValue={period?.end_date ?? `${year}-12-31`} errors={state.fieldErrors?.endDate} /><div className="sm:col-span-2"><FormMessage state={state} /></div></form></AppConfirmDialog>;
}

function DateField({ id, name, label, defaultValue, errors }: { id: string; name: string; label: string; defaultValue: string; errors?: string[] }) { return <div><label className="auth-label" htmlFor={id}>{label}</label><input className="auth-input" id={id} name={name} type="date" required defaultValue={defaultValue} /><FieldError messages={errors} /></div>; }
