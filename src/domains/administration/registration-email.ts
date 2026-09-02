import "server-only";

import { Resend } from "resend";
import { APP_NAME } from "@/lib/app";
import { getApplicationOrigin } from "@/lib/auth/redirects";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export async function sendApplicationActivationEmail({ email, firstName }: { email: string; firstName: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY absente.");

  const loginUrl = `${await getApplicationOrigin()}/connexion`;
  const greeting = firstName.trim() ? `Bonjour ${firstName.trim()},` : "Bonjour,";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${APP_NAME} <noreply@patrigest.fr>`,
    to: email,
    subject: "Votre accès à PatriGest est activé",
    text: [
      greeting,
      "Votre inscription à PatriGest a été validée.",
      "Vous pouvez maintenant vous connecter et commencer à utiliser l’application.",
      `Se connecter à PatriGest : ${loginUrl}`,
      "La gestion claire du patrimoine protégé.",
    ].join("\n\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <p>${escapeHtml(greeting)}</p>
        <p>Votre inscription à ${APP_NAME} a été validée.</p>
        <p>Vous pouvez maintenant vous connecter et commencer à utiliser l’application.</p>
        <p style="margin:24px 0">
          <a href="${escapeHtml(loginUrl)}" style="display:inline-block;border-radius:10px;background:#2563eb;color:#fff;padding:11px 18px;text-decoration:none;font-weight:700">Se connecter à PatriGest</a>
        </p>
        <p style="font-size:12px;color:#64748b">La gestion claire du patrimoine protégé.</p>
      </div>
    `,
  });

  if (error) throw new Error("Échec de l’envoi Resend.");
}
