import "server-only";
import { notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function requirePlatformAdministrator() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) notFound();
  const { data } = await supabase.from("platform_administrators").select("user_id").eq("user_id", userId).maybeSingle();
  if (!data) notFound();
  return { supabase, userId };
}

export async function getAccountRequests() {
  const { supabase } = await requirePlatformAdministrator();
  const { data, error } = await supabase.from("account_requests").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Impossible de charger les demandes.");
  return data;
}

export async function getPlatformUsers() {
  await requirePlatformAdministrator();
  const admin = createAdminClient();
  const users = await getAllAuthUsers(admin);
  const ids = users.map((user) => user.id);
  const [{ data: profiles }, { data: owned }] = await Promise.all([
    ids.length ? admin.from("profiles").select("id,first_name,last_name").in("id", ids) : Promise.resolve({ data: [] }),
    ids.length ? admin.from("protected_persons").select("owner_id").in("owner_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const counts = new Map<string, number>();
  for (const person of owned ?? []) counts.set(person.owner_id, (counts.get(person.owner_id) ?? 0) + 1);
  return users.map((user) => ({ id: user.id, email: user.email ?? "", createdAt: user.created_at, firstName: profileById.get(user.id)?.first_name ?? "", lastName: profileById.get(user.id)?.last_name ?? "", ownedDossiers: counts.get(user.id) ?? 0 }));
}

export type AdministrationDashboardData = {
  usersCount: number;
  pendingRequestsCount: number;
  pendingInvitationsCount: number;
  pendingRequests: Awaited<ReturnType<typeof getAccountRequests>>;
};

export async function getAdministrationDashboardData(): Promise<AdministrationDashboardData> {
  const { supabase } = await requirePlatformAdministrator();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [users, requestsResult, invitationsResult] = await Promise.all([
    getAllAuthUsers(admin),
    supabase.from("account_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    admin.from("protected_person_invitations").select("id", { count: "exact", head: true }).is("accepted_at", null).gt("expires_at", now),
  ]);

  if (requestsResult.error || invitationsResult.error) {
    throw new Error("Impossible de charger le tableau de bord d’administration.");
  }

  return {
    usersCount: users.length,
    pendingRequestsCount: requestsResult.data.length,
    pendingInvitationsCount: invitationsResult.count ?? 0,
    pendingRequests: requestsResult.data.slice(0, 5),
  };
}

async function getAllAuthUsers(admin: ReturnType<typeof createAdminClient>) {
  const users: User[] = [];
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error("Impossible de charger les utilisateurs.");
    users.push(...data.users);
    if (data.users.length < perPage) return users;
  }
}
