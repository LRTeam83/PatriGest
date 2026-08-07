import type { AuthError } from "@supabase/supabase-js";

const messagesByCode: Record<string, string> = {
  email_not_confirmed:
    "Confirmez votre adresse email avant de vous connecter.",
  invalid_credentials: "Adresse email ou mot de passe incorrect.",
  over_email_send_rate_limit:
    "Trop de demandes ont été envoyées. Réessayez dans quelques minutes.",
  user_already_exists: "Un compte existe déjà avec cette adresse email.",
  weak_password: "Choisissez un mot de passe plus robuste.",
  same_password: "Le nouveau mot de passe doit être différent de l’ancien.",
};

export function getAuthErrorMessage(
  error: AuthError,
  fallback: string,
) {
  return messagesByCode[error.code ?? ""] ?? fallback;
}
