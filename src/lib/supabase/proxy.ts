import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(cacheHeaders).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = ["/tableau-de-bord", "/dossiers", "/administration", "/parametres"].some((path) =>
    pathname.startsWith(path),
  );

  if (isProtectedRoute && !data?.claims) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/connexion";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (data?.claims) {
    const userId = data.claims.sub;
    const { data: administrator } = await supabase.from("platform_administrators").select("user_id").eq("user_id", userId).maybeSingle();
    const isBusinessRoute = pathname.startsWith("/dossiers") || pathname.startsWith("/parametres/categories");

    if (administrator && isBusinessRoute) {
      const administrationUrl = request.nextUrl.clone();
      administrationUrl.pathname = "/administration";
      administrationUrl.search = "";
      return NextResponse.redirect(administrationUrl);
    }
  }

  return response;
}
