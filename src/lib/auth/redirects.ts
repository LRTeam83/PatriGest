import { headers } from "next/headers";

const allowedApplicationOrigins = new Set([
  "https://patrigest.fr",
  "https://www.patrigest.fr",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const canonicalApplicationOrigin = "https://patrigest.fr";

function getAllowedApplicationOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    const origin = new URL(value).origin;
    return allowedApplicationOrigins.has(origin) ? origin : null;
  } catch {
    return null;
  }
}

export function getSafeNextPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export async function getApplicationOrigin() {
  const configuredOrigin = getAllowedApplicationOrigin(process.env.APP_URL);
  if (configuredOrigin) return configuredOrigin;

  return canonicalApplicationOrigin;
}

export async function getAuthCallbackOrigin() {
  const requestHeaders = await headers();
  const requestOrigin = getAllowedApplicationOrigin(requestHeaders.get("origin"));
  if (requestOrigin) return requestOrigin;

  return getApplicationOrigin();
}

export async function getPasswordRecoveryRedirectUrl() {
  const origin = await getAuthCallbackOrigin();

  return `${origin}/auth/callback?next=/nouveau-mot-de-passe`;
}
