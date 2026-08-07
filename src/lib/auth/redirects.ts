import { headers } from "next/headers";

const allowedHosts = new Set([
  "patrigest.fr",
  "www.patrigest.fr",
  "localhost",
  "127.0.0.1",
]);

export function getSafeNextPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export async function getApplicationOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      if (allowedHosts.has(parsedOrigin.hostname)) {
        return parsedOrigin.origin;
      }
    } catch {
      // Une origine mal formée est ignorée au profit du domaine canonique.
    }
  }

  return "https://patrigest.fr";
}

export async function getPasswordRecoveryRedirectUrl() {
  const origin = await getApplicationOrigin();

  return `${origin}/auth/callback?next=/nouveau-mot-de-passe`;
}
