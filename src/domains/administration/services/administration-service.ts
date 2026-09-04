import "server-only";
import { notFound } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendApplicationActivationEmail } from "../registration-email";

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

export async function getPendingApplicationRegistrations() {
  await requirePlatformAdministrator();
  const admin = createAdminClient();
  const { data: authorizations, error } = await admin
    .from("application_user_authorizations")
    .select("user_id,status,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Impossible de charger les inscriptions en attente.");
  if (!authorizations.length) return [];

  const ids = authorizations.map((authorization) => authorization.user_id);
  const [users, { data: profiles, error: profileError }] = await Promise.all([
    getAllAuthUsers(admin),
    admin.from("profiles").select("id,first_name,last_name").in("id", ids),
  ]);
  if (profileError) throw new Error("Impossible de charger les inscriptions en attente.");
  const userById = new Map(users.map((user) => [user.id, user]));
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return authorizations.flatMap((authorization) => {
    const user = userById.get(authorization.user_id);
    if (!user?.email_confirmed_at) return [];
    return [{
      userId: authorization.user_id,
      email: user.email ?? "",
      firstName: profileById.get(authorization.user_id)?.first_name ?? "",
      lastName: profileById.get(authorization.user_id)?.last_name ?? "",
      createdAt: user.created_at,
      emailConfirmedAt: user.email_confirmed_at,
      status: authorization.status,
    }];
  });
}

export async function reviewApplicationRegistration(userId: string, decision: "active" | "rejected") {
  const { supabase } = await requirePlatformAdministrator();
  const admin = createAdminClient();
  const [{ data: targetResult, error: targetError }, { data: profile, error: profileError }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("first_name,last_name").eq("id", userId).maybeSingle(),
  ]);
  if (targetError || !targetResult.user || profileError) throw new Error("Inscription introuvable.");
  if (!targetResult.user.email_confirmed_at) throw new Error("L’adresse e-mail doit être confirmée avant validation.");

  const { error } = await supabase.rpc("review_application_user_registration", {
    p_user_id: userId,
    p_decision: decision,
  });
  if (error) {
    if (error.message.includes("déjà été traitée")) throw new Error("Cette inscription a déjà été traitée.");
    throw new Error("Impossible de traiter cette inscription.");
  }

  if (decision === "rejected") return { emailSent: false };
  try {
    await sendApplicationActivationEmail({
      email: targetResult.user.email ?? "",
      firstName: profile?.first_name ?? "",
    });
    return { emailSent: true };
  } catch {
    return { emailSent: false };
  }
}

export async function resendApplicationActivationEmail(userId: string) {
  await requirePlatformAdministrator();
  const admin = createAdminClient();
  const [{ data: targetResult, error: targetError }, { data: authorization, error: authorizationError }, { data: profile, error: profileError }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("application_user_authorizations").select("status").eq("user_id", userId).maybeSingle(),
    admin.from("profiles").select("first_name").eq("id", userId).maybeSingle(),
  ]);
  if (targetError || !targetResult.user || authorizationError || profileError) throw new Error("Compte utilisateur introuvable.");
  if (authorization?.status !== "active") throw new Error("L’accès de ce compte n’est pas actif.");
  if (!targetResult.user.email) throw new Error("Aucune adresse e-mail n’est disponible pour ce compte.");
  await sendApplicationActivationEmail({ email: targetResult.user.email, firstName: profile?.first_name ?? "" });
}

export async function getPlatformUsers() {
  const { userId: currentUserId } = await requirePlatformAdministrator();
  const admin = createAdminClient();
  const users = await getAllAuthUsers(admin);
  const ids = users.map((user) => user.id);
  const [{ data: profiles }, { data: owned }, { data: administrators }, { data: authorizations }] = await Promise.all([
    ids.length ? admin.from("profiles").select("id,first_name,last_name").in("id", ids) : Promise.resolve({ data: [] }),
    ids.length ? admin.from("protected_persons").select("owner_id").in("owner_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? admin.from("platform_administrators").select("user_id").in("user_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? admin.from("application_user_authorizations").select("user_id,status").in("user_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const counts = new Map<string, number>();
  for (const person of owned ?? []) counts.set(person.owner_id, (counts.get(person.owner_id) ?? 0) + 1);
  const administratorIds = new Set((administrators ?? []).map((administrator) => administrator.user_id));
  const authorizationById = new Map((authorizations ?? []).map((authorization) => [authorization.user_id, authorization.status]));
  return users.map((user) => ({ id: user.id, email: user.email ?? "", createdAt: user.created_at, firstName: profileById.get(user.id)?.first_name ?? "", lastName: profileById.get(user.id)?.last_name ?? "", ownedDossiers: counts.get(user.id) ?? 0, authorizationStatus: authorizationById.get(user.id), canResendActivationEmail: authorizationById.get(user.id) === "active" && !administratorIds.has(user.id), canDelete: user.id !== currentUserId && !administratorIds.has(user.id) }));
}

export async function deletePlatformUser(userId: string) {
  const { userId: currentUserId } = await requirePlatformAdministrator();
  if (userId === currentUserId) throw new Error("Vous ne pouvez pas supprimer votre propre compte administrateur.");
  const admin = createAdminClient();
  const { data: targetResult, error: targetError } = await admin.auth.admin.getUserById(userId);
  if (targetError || !targetResult.user) throw new Error("Utilisateur introuvable.");
  const email = targetResult.user.email ?? "";
  const now = new Date().toISOString();
  const [administrator, owned, access, invitedAccess, invitations, activeInvitation, categories, documents] = await Promise.all([
    admin.from("platform_administrators").select("user_id").or(`user_id.eq.${userId},appointed_by.eq.${userId}`).limit(1),
    admin.from("protected_persons").select("id").eq("owner_id", userId).limit(1),
    admin.from("protected_person_access").select("id").eq("user_id", userId).limit(1),
    admin.from("protected_person_access").select("id").eq("invited_by", userId).limit(1),
    admin.from("protected_person_invitations").select("id").eq("invited_by", userId).limit(1),
    email ? admin.from("protected_person_invitations").select("id").ilike("email", email).is("accepted_at", null).is("revoked_at", null).gt("expires_at", now).limit(1) : Promise.resolve({ data: [], error: null }),
    admin.from("categories").select("id").eq("owner_id", userId).limit(1),
    admin.from("transaction_documents").select("id").eq("created_by", userId).limit(1),
  ]);
  const results = [administrator, owned, access, invitedAccess, invitations, activeInvitation, categories, documents];
  if (results.some((result) => result.error)) throw new Error("Impossible de vérifier les dépendances de cet utilisateur.");
  if (administrator.data?.length) throw new Error("Cet utilisateur possède encore une relation d’administration et ne peut pas être supprimé.");
  if (owned.data?.length || access.data?.length || invitedAccess.data?.length || invitations.data?.length || activeInvitation.data?.length || categories.data?.length || documents.data?.length) {
    throw new Error("Cet utilisateur ne peut pas être supprimé tant qu’il possède un dossier ou dispose encore d’un accès ou de données métier associées.");
  }
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error("Impossible de supprimer cet utilisateur.");
}

export type AdministrationDashboardData = {
  usersCount: number;
  pendingRequestsCount: number;
  pendingInvitationsCount: number;
  pendingRequests: Awaited<ReturnType<typeof getAccountRequests>>;
  pendingRegistrations: Awaited<ReturnType<typeof getPendingApplicationRegistrations>>;
};

export async function getAdministrationDashboardData(): Promise<AdministrationDashboardData> {
  const { supabase } = await requirePlatformAdministrator();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [users, requestsResult, invitationsResult, pendingRegistrations] = await Promise.all([
    getAllAuthUsers(admin),
    supabase.from("account_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    admin.from("protected_person_invitations").select("id", { count: "exact", head: true }).is("accepted_at", null).is("revoked_at", null).gt("expires_at", now),
    getPendingApplicationRegistrations(),
  ]);

  if (requestsResult.error || invitationsResult.error) {
    throw new Error("Impossible de charger le tableau de bord d’administration.");
  }

  return {
    usersCount: users.length,
    pendingRequestsCount: pendingRegistrations.length,
    pendingInvitationsCount: invitationsResult.count ?? 0,
    pendingRequests: requestsResult.data.slice(0, 5),
    pendingRegistrations: pendingRegistrations.slice(0, 5),
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
