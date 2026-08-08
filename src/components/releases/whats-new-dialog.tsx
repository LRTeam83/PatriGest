"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { AppRelease } from "@/lib/releases";
import { APP_NAME } from "@/lib/app";

type WhatsNewDialogProps = {
  open: boolean;
  release: AppRelease;
  pending?: boolean;
  onClose: () => void;
  onRead: () => void;
};

export function WhatsNewDialog({ open, release, pending = false, onClose, onRead }: WhatsNewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog ref={dialogRef} aria-labelledby="whats-new-title" className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-0 text-[#0F172A] shadow-2xl backdrop:bg-slate-950/45" onCancel={onClose} onClose={onClose}>
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-bold text-[#2563EB]">Nouveautés de {APP_NAME} v{release.version}</p><h2 id="whats-new-title" className="mt-2 text-2xl font-bold tracking-tight">{release.title}</h2></div>
          <button ref={closeButtonRef} type="button" className="focus-ring flex size-9 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-slate-100" aria-label="Fermer la fenêtre" onClick={onClose}><X aria-hidden="true" size={19} /></button>
        </div>
        <p className="mt-4 leading-7 text-[#64748B]">{release.summary}</p>
        <ul className="mt-5 space-y-2 text-sm text-[#475569]">{release.changes.map((change) => <li key={change} className="flex gap-2"><span aria-hidden="true" className="text-[#16A34A]">✓</span><span>{change}</span></li>)}</ul>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/historique-versions" className="button button-secondary" onClick={onClose}>Voir tout l’historique</Link>
          <button type="button" className="button button-primary" disabled={pending} onClick={onRead}>{pending ? "Enregistrement…" : "J’ai lu"}</button>
        </div>
      </div>
    </dialog>
  );
}
