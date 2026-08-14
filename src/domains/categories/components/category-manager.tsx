"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Archive, LockKeyhole, Pencil, Plus, RotateCcw } from "lucide-react";
import { FieldError, FormMessage } from "@/components/auth/form-controls";
import { AppConfirmDialog } from "@/components/ui/app-confirm-dialog";
import type { Category } from "@/types/database";
import { archiveCategoryAction, createCategoryAction, reactivateCategoryAction, updateCategoryAction } from "../actions";
import { suggestOfficialCategories } from "../category-suggestions";
import { initialCategoryState } from "../state";

const usageLabels = { income: "Recettes", expense: "Dépenses", both: "Recettes et dépenses" } as const;

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const official = categories.filter((category) => category.is_system && category.active && category.official_code);
  const personal = categories.filter((category) => !category.is_system && category.active);
  const archived = categories.filter((category) => !category.is_system && !category.active);

  return <div className="mt-5 space-y-6">
    <section>
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Catégories personnelles</h2><p className="text-xs text-[#64748B]">Vos libellés restent rattachés à une rubrique officielle.</p></div><button type="button" className="button button-primary gap-1.5" onClick={() => setCreateOpen(true)}><Plus size={15} />Nouvelle catégorie</button></div>
      <div className="mt-3 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white divide-y divide-[#E2E8F0]">{personal.length ? personal.map((category) => <CategoryRow key={category.id} category={category} officialCategories={official} />) : <p className="px-3.5 py-3 text-xs text-[#64748B]">Aucune catégorie personnelle active.</p>}</div>
      <details className="mt-3 rounded-xl border border-[#E2E8F0] bg-white"><summary className="focus-ring cursor-pointer list-none rounded-xl px-3.5 py-3 text-sm font-bold">Catégories personnelles archivées ({archived.length})</summary><div className="border-t border-[#E2E8F0] divide-y divide-[#E2E8F0]">{archived.length ? archived.map((category) => <ArchivedCategoryRow key={category.id} category={category} officialCategories={official} />) : <p className="px-3.5 py-3 text-xs text-[#64748B]">Aucune catégorie archivée.</p>}</div></details>
    </section>
    <section><h2 className="text-lg font-bold">Référentiel officiel</h2><p className="text-xs text-[#64748B]">Modèle de compte de gestion — arrêté du 4 juillet 2024.</p><OfficialReference categories={official} /></section>
    <CategoryDialog open={createOpen} onClose={() => setCreateOpen(false)} officialCategories={official} />
  </div>;
}

function OfficialReference({ categories }: { categories: Category[] }) {
  const sections = ["income", "expense"] as const;
  return <div className="mt-3 grid gap-4 lg:grid-cols-2">{sections.map((usage) => <div key={usage} className="rounded-xl border border-[#E2E8F0] bg-white p-3"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-extrabold">{usageLabels[usage]}</h3><span className="flex items-center gap-1 text-[10px] font-semibold text-[#64748B]"><LockKeyhole size={12} />Officielles</span></div><div className="mt-2 space-y-3">{groupCategories(categories.filter((category) => category.usage === usage)).map(([group, rows]) => <div key={group}><h4 className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{group}</h4><ul className="mt-1 divide-y divide-[#F1F5F9]">{rows.map((category) => <li key={category.id} className="flex items-start gap-2 py-1.5 text-xs"><code className="shrink-0 rounded bg-slate-100 px-1 py-0.5 text-[10px] text-[#64748B]">{category.official_code}</code><span>{category.name}</span></li>)}</ul></div>)}</div></div>)}</div>;
}

function CategoryRow({ category, officialCategories }: { category: Category; officialCategories: Category[] }) {
  const [editOpen, setEditOpen] = useState(false);
  return <div className="flex flex-col gap-2 px-3.5 py-2 sm:flex-row sm:items-center sm:justify-between"><CategoryIdentity category={category} officialCategories={officialCategories} /><div className="flex gap-1.5"><button type="button" className="button button-secondary gap-1.5" onClick={() => setEditOpen(true)}><Pencil size={14} />Modifier</button><form action={archiveCategoryAction.bind(null, category.id)}><button className="button button-secondary gap-1.5" type="submit"><Archive size={14} />Archiver</button></form></div><CategoryDialog category={category} open={editOpen} onClose={() => setEditOpen(false)} officialCategories={officialCategories} /></div>;
}

function ArchivedCategoryRow({ category, officialCategories }: { category: Category; officialCategories: Category[] }) {
  const [editOpen, setEditOpen] = useState(false);
  return <div className="flex flex-col gap-2 px-3.5 py-2 sm:flex-row sm:items-center sm:justify-between"><CategoryIdentity category={category} officialCategories={officialCategories} /><div className="flex gap-1.5">{!category.official_category_id && <button type="button" className="button button-secondary gap-1.5" onClick={() => setEditOpen(true)}><Pencil size={14} />Classer</button>}<form action={reactivateCategoryAction.bind(null, category.id)}><button className="button button-secondary gap-1.5" type="submit" disabled={!category.official_category_id}><RotateCcw size={14} />Réactiver</button></form></div><CategoryDialog category={category} open={editOpen} onClose={() => setEditOpen(false)} officialCategories={officialCategories} /></div>;
}

function CategoryIdentity({ category, officialCategories }: { category: Category; officialCategories: Category[] }) {
  const official = officialCategories.find((candidate) => candidate.id === category.official_category_id);
  return <div className="min-w-0"><p className="truncate text-sm font-semibold">{category.name}</p><p className="text-[11px] text-[#64748B]">{official ? `${official.official_group} · ${official.name}` : `${usageLabels[category.usage]} · rattachement officiel à préciser`}</p></div>;
}

function CategoryDialog({ category, open, onClose, officialCategories }: { category?: Category; open: boolean; onClose: () => void; officialCategories: Category[] }) {
  const action = category ? updateCategoryAction.bind(null, category.id) : createCategoryAction;
  const [state, formAction] = useActionState(action, initialCategoryState);
  const previousState = useRef(state);
  const formId = `category-form-${category?.id ?? "new"}`;
  useEffect(() => { if (open && state.status === "success" && previousState.current !== state) onClose(); previousState.current = state; }, [open, state, onClose]);
  return <AppConfirmDialog open={open} onClose={onClose} title={category ? "Modifier la catégorie" : "Nouvelle catégorie"} description="Choisissez le libellé personnel puis sa rubrique officielle de rattachement." actions={<button className="button button-primary" type="submit" form={formId}>{category ? "Enregistrer" : "Créer"}</button>}><form id={formId} action={formAction} className="space-y-4"><Fields state={state} category={category} officialCategories={officialCategories} /><FormMessage state={state} /></form></AppConfirmDialog>;
}

function Fields({ state, category, officialCategories }: { state: { fieldErrors?: Record<string, string[] | undefined> }; category?: Category; officialCategories: Category[] }) {
  const suffix = category?.id ?? "new";
  const [name, setName] = useState(category?.name ?? "");
  const [usage, setUsage] = useState<"income" | "expense">(category?.usage === "income" ? "income" : "expense");
  const compatible = officialCategories.filter((official) => official.usage === usage);
  const suggestion = suggestOfficialCategories(name, usage, compatible)[0];
  return <><div><label className="auth-label" htmlFor={`name-${suffix}`}>Nom *</label><input className="auth-input" id={`name-${suffix}`} name="name" required value={name} onChange={(event) => setName(event.target.value)} /><FieldError messages={state.fieldErrors?.name} /></div><div><label className="auth-label" htmlFor={`usage-${suffix}`}>Usage *</label><select className="auth-input" id={`usage-${suffix}`} name="usage" value={usage} onChange={(event) => setUsage(event.target.value as "income" | "expense")}><option value="income">Recette</option><option value="expense">Dépense</option></select><FieldError messages={state.fieldErrors?.usage} /></div>{suggestion && <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-[#1D4ED8]">Suggestion PatriGest : <strong>{suggestion.name}</strong></p>}<div><label className="auth-label" htmlFor={`official-${suffix}`}>Rubrique officielle *</label><select className="auth-input" id={`official-${suffix}`} name="officialCategoryId" required defaultValue={category?.usage === usage ? category.official_category_id ?? "" : ""}><option value="" disabled>Choisir une rubrique</option>{groupCategories(compatible).map(([group, rows]) => <optgroup key={group} label={group}>{rows.map((official) => <option key={official.id} value={official.id}>{official.name}</option>)}</optgroup>)}</select><FieldError messages={state.fieldErrors?.officialCategoryId} /></div>{category && <p className="text-xs text-[#B45309]">Cette modification changera le classement des opérations utilisant cette catégorie dans les futurs comptes de gestion.</p>}</>;
}

function groupCategories(categories: Category[]): [string, Category[]][] {
  const groups = new Map<string, Category[]>();
  for (const category of categories) { const group = category.official_group ?? "Autres"; groups.set(group, [...(groups.get(group) ?? []), category]); }
  return [...groups.entries()];
}
