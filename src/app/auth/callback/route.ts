import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"), "/tableau-de-bord");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: claims } = await supabase.auth.getClaims();
      const userId = claims?.claims?.sub;
      if (!userId) {
        const response = NextResponse.redirect(new URL("/connexion?erreur=confirmation", request.url));
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }

      const [{ data: authorization }, { data: administrator }] = await Promise.all([
        supabase.from("application_user_authorizations").select("status").eq("user_id", userId).maybeSingle(),
        supabase.from("platform_administrators").select("user_id").eq("user_id", userId).maybeSingle(),
      ]);
      const invitationPath = nextPath.startsWith("/invitation/") ? nextPath : null;
      const destination = invitationPath ?? (administrator || authorization?.status === "active" ? "/tableau-de-bord" : "/acces-en-attente");
      const response = NextResponse.redirect(new URL(destination, request.url));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }

  const response = NextResponse.redirect(new URL("/connexion?erreur=confirmation", request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
