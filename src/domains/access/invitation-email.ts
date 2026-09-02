import "server-only";

import { Resend } from "resend";
import { APP_NAME } from "@/lib/app";
import type { SharedAccessRole } from "@/types/database";

export async function sendDossierInvitationEmail({
  email,
  role,
  invitationUrl,
  expiresAt,
}: {
  email: string;
  role: SharedAccessRole;
  invitationUrl: string;
  expiresAt: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY absente.");

  const roleLabel = role === "manager" ? "Gestionnaire" : "Lecture seule";
  const expirationLabel = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(expiresAt));
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@patrigest.fr>`,
    to: email,
    subject: "Invitation à accéder à un dossier PatriGest",
    text: [
      `Un utilisateur ${APP_NAME} vous propose un accès à un dossier.`,
      `Rôle proposé : ${roleLabel}.`,
      `Cette invitation est valable jusqu’au ${expirationLabel}.`,
      `Accepter l’invitation : ${invitationUrl}`,
    ].join("\n\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h1 style="font-size:22px">${APP_NAME}</h1>
        <p>Un utilisateur ${APP_NAME} vous propose un accès à un dossier.</p>
        <p><strong>Rôle proposé :</strong> ${roleLabel}</p>
        <p>Cette invitation est valable jusqu’au ${expirationLabel}.</p>
        <p style="margin:24px 0">
          <a href="${invitationUrl}" style="display:inline-block;border-radius:10px;background:#2563eb;color:#fff;padding:11px 18px;text-decoration:none;font-weight:700">Accepter l’invitation</a>
        </p>
        <p style="font-size:12px;color:#64748b">Si vous n’attendiez pas cette invitation, vous pouvez ignorer ce message.</p>
      </div>
    `,
  });

  if (error) throw new Error("Échec de l’envoi Resend.");
}
