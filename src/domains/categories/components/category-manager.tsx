"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Archive, LockKeyhole, Pencil, Plus, RotateCcw } from "lucide-react";
import type { Category } from "@/types/database";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import { FieldError, FormMessage } from "@/components/auth/form-controls";
import { archiveCategoryAction, createCategoryAction, reactivateCategoryAction, updateCategoryAction } from "../actions";
import { initialCategoryState } from "../state";

const usageLabels = { income: "Recettes", expense: "Dépenses", both: "Recettes et dépenses" } as const;

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const active = categories.filter((category) => category.active);
  const archived = categories.filter((category) => !category.active && !category.is_system);
  return <div className="mt-8">
    <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Catégories actives</h2><button type="button" className="button button-primary gap-2" onClick={() => setCreateOpen(true)}><Plus size={17} />Nouvelle catégorie</button></div>
    <div className="mt-4 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white divide-y divide-[#E2E8F0]">{active.map((category) => <CategoryRow key={category.id} category={category} />)}</div>
    <details className="mt-8 rounded-2xl border border-[#E2E8F0] bg-white"><summary className="focus-ring cursor-pointer list-none rounded-2xl px-5 py-4 font-bold">Voir les catégories archivées ({archived.length})</summary><div className="border-t border-[#E2E8F0] divide-y divide-[#E2E8F0]">{archived.length ? archived.map((category) => <div key={category.id} className="flex items-center justify-between gap-4 px-5 py-3"><CategoryIdentity category={category} /><form action={reactivateCategoryAction.bind(null, category.id)}><button className="button button-secondary gap-2" type="submit"><RotateCcw size={15} />Réactiver</button></form></div>) : <p className="px-5 py-4 text-sm text-[#64748B]">Aucune catégorie archivée.</p>}</div></details>
    <CategoryDialog open={createOpen} onClose={() => setCreateOpen(false)} />
  </div>;
}

function CategoryRow({ category }: { category: Category }) {
  const [editOpen, setEditOpen] = useState(false);
  return <div className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"><CategoryIdentity category={category} />{category.is_system ? <span className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8]"><LockKeyhole size={15} />Système</span> : <div className="flex gap-2"><button type="button" className="button button-secondary gap-2" onClick={() => setEditOpen(true)}><Pencil size={15} />Modifier</button><form action={archiveCategoryAction.bind(null, category.id)}><button className="button button-secondary gap-2" type="submit"><Archive size={15} />Archiver</button></form></div>}<CategoryDialog category={category} open={editOpen} onClose={() => setEditOpen(false)} /></div>;
}

function CategoryIdentity({ category }: { category: Category }) { return <div className="min-w-0"><p className="truncate font-semibold">{category.name}</p><p className="mt-0.5 text-xs text-[#64748B]">{usageLabels[category.usage]} · {category.is_system ? "Système" : "Personnelle"}</p></div>; }

function CategoryDialog({ category, open, onClose }: { category?: Category; open: boolean; onClose: () => void }) {
  const action = category ? updateCategoryAction.bind(null, category.id) : createCategoryAction;
  const [state, formAction] = useActionState(action, initialCategoryState);
  const previousState = useRef(state);
  const formId = `category-form-${category?.id ?? "new"}`;
  useEffect(() => { if (open && state.status === "success" && previousState.current !== state) onClose(); previousState.current = state; }, [open, state, onClose]);
  return <AppConfirmDialog open={open} onClose={onClose} title={category ? "Modifier la catégorie" : "Nouvelle catégorie"} description={category ? "Modifiez le nom ou l’utilisation de cette catégorie personnelle." : "Créez une catégorie adaptée à votre classement."} actions={<button className="button button-primary" type="submit" form={formId}>{category ? "Enregistrer" : "Créer"}</button>}><form id={formId} action={formAction} className="space-y-4"><Fields state={state} category={category} /><FormMessage state={state} /></form></AppConfirmDialog>;
}

function Fields({ state, category }: { state: { fieldErrors?: Record<string, string[] | undefined> }; category?: Category }) { const suffix = category?.id ?? "new"; return <><div><label className="auth-label" htmlFor={`name-${suffix}`}>Nom *</label><input className="auth-input" id={`name-${suffix}`} name="name" required defaultValue={category?.name ?? ""} /><FieldError messages={state.fieldErrors?.name} /></div><div><label className="auth-label" htmlFor={`usage-${suffix}`}>Utilisation *</label><select className="auth-input" id={`usage-${suffix}`} name="usage" defaultValue={category?.usage ?? "expense"}>{Object.entries(usageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><FieldError messages={state.fieldErrors?.usage} /></div></>; }
