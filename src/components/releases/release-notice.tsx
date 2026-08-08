"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/app";
import type { AppRelease } from "@/lib/releases";
import { markCurrentVersionAsSeen } from "@/components/releases/actions";
import { WhatsNewDialog } from "@/components/releases/whats-new-dialog";

export function ReleaseNotice({ release }: { release: AppRelease }) {
  const [visible, setVisible] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function markAsRead() {
    startTransition(async () => {
      await markCurrentVersionAsSeen();
      setDialogOpen(false);
      setVisible(false);
    });
  }

  if (!visible) return null;

  return (
    <>
      <aside className="border-b border-blue-100 bg-blue-50" aria-label="Nouvelle version disponible">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="flex items-start gap-2 text-sm font-semibold text-blue-950"><Sparkles aria-hidden="true" className="mt-0.5 shrink-0 text-[#2563EB]" size={17} /><span>{APP_NAME} v{release.version} est disponible — Découvrez les nouveautés.</span></p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="button button-primary min-h-9 px-4" onClick={() => setDialogOpen(true)}>Voir les nouveautés</button>
            <button type="button" className="button button-secondary min-h-9 px-4" disabled={pending} onClick={markAsRead}>{pending ? "Enregistrement…" : "Marquer comme lu"}</button>
          </div>
        </div>
      </aside>
      <WhatsNewDialog open={dialogOpen} release={release} pending={pending} onClose={() => setDialogOpen(false)} onRead={markAsRead} />
    </>
  );
}
