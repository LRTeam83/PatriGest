import "server-only";
import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function getInvitationPreview(token: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("protected_person_invitations").select("id,email,role,protected_person_id,invited_by,expires_at,accepted_at").eq("token_hash", createHash("sha256").update(token).digest("hex")).maybeSingle();
  if (!data || data.accepted_at || new Date(data.expires_at) <= new Date()) return null;
  const [{ data: owner }, { data: person }] = await Promise.all([admin.from("profiles").select("first_name,last_name").eq("id", data.invited_by).maybeSingle(), admin.from("protected_persons").select("first_name,last_name").eq("id", data.protected_person_id).maybeSingle()]);
  const { data: userData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return { ...data, ownerName: [owner?.first_name, owner?.last_name].filter(Boolean).join(" ") || "Un utilisateur PatriGest", personName: person ? `${person.first_name} ${person.last_name}` : "", accountExists: userData.users.some((user) => user.email?.toLowerCase() === data.email.toLowerCase()) };
}

export async function getDossierAccess(protectedPersonId: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) notFound();
  const { data: person } = await supabase.from("protected_persons").select("*").eq("id", protectedPersonId).eq("owner_id", userId).maybeSingle();
  if (!person) notFound();
  const admin = createAdminClient();
  const [{ data: owner }, { data: access }, { data: invitations }] = await Promise.all([admin.auth.admin.getUserById(userId), admin.from("protected_person_access").select("*").eq("protected_person_id", protectedPersonId).order("created_at"), admin.from("protected_person_invitations").select("id,email,role,expires_at,created_at").eq("protected_person_id", protectedPersonId).is("accepted_at", null).order("created_at", { ascending: false })]);
  const collaborators = await Promise.all((access ?? []).map(async (entry) => { const { data: authUser } = await admin.auth.admin.getUserById(entry.user_id); const { data: profile } = await admin.from("profiles").select("first_name,last_name").eq("id", entry.user_id).maybeSingle(); return { ...entry, email: authUser.user?.email ?? "", name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") }; }));
  return { person, ownerEmail: owner.user?.email ?? "", collaborators, invitations: invitations ?? [] };
}
