"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApplicationOrigin } from "@/lib/auth/redirects";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AccessActionState } from "./state";

const requestSchema = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), email: z.email().trim().toLowerCase(), message: z.string().trim().max(1000).optional() });

async function requirePlatformAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) throw new Error("Accès refusé.");
  const { data } = await supabase.from("platform_administrators").select("user_id").eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("Accès refusé.");
  return { supabase, userId };
}

export async function submitAccountRequestAction(_state: AccessActionState, formData: FormData): Promise<AccessActionState> {
  const parsed = requestSchema.safeParse({ firstName: formData.get("firstName"), lastName: formData.get("lastName"), email: formData.get("email"), message: formData.get("message") || undefined });
  if (!parsed.success) return { status: "error", message: "Vérifiez les informations saisies.", fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { error } = await supabase.from("account_requests").insert({ first_name: parsed.data.firstName, last_name: parsed.data.lastName, email: parsed.data.email, message: parsed.data.message || null });
  if (error?.code === "23505") return { status: "error", message: "Une demande est déjà en attente pour cette adresse email." };
  if (error) return { status: "error", message: "Impossible d’envoyer votre demande. Réessayez dans quelques instants." };
  return { status: "success", message: "Votre demande a bien été envoyée. Vous recevrez un email lorsqu’elle aura été traitée." };
}

export async function reviewAccountRequestAction(_state: AccessActionState, formData: FormData): Promise<AccessActionState> {
  try {
    const { supabase, userId } = await requirePlatformAdmin();
    const id = z.string().uuid().parse(formData.get("id"));
    const decision = z.enum(["approved", "rejected"]).parse(formData.get("decision"));
    if (decision === "rejected") {
      const { error } = await supabase.from("account_requests").update({ status: decision, reviewed_at: new Date().toISOString(), reviewed_by: userId }).eq("id", id).eq("status", "pending");
      if (error) throw error;
      revalidatePath("/administration/demandes");
      return { status: "success", message: "La demande a été refusée." };
    }
    const invitation = await createAccountInvitation();
    const { error } = await supabase.from("account_requests").update({ status: decision, reviewed_at: new Date().toISOString(), reviewed_by: userId, invitation_token_hash: invitation.tokenHash, invitation_expires_at: invitation.expiresAt }).eq("id", id).eq("status", "pending");
    if (error) throw error;
    return { status: "success", message: "Demande approuvée", invitationUrl: invitation.url, invitationExpiresAt: invitation.expiresAt };
  } catch { return { status: "error", message: "Impossible de traiter cette demande." }; }
}

export async function regenerateAccountInvitationAction(_state: AccessActionState, formData: FormData): Promise<AccessActionState> {
  try {
    const { supabase } = await requirePlatformAdmin();
    const id = z.string().uuid().parse(formData.get("id"));
    const invitation = await createAccountInvitation();
    const { data, error } = await supabase.from("account_requests").update({ invitation_token_hash: invitation.tokenHash, invitation_expires_at: invitation.expiresAt }).eq("id", id).eq("status", "approved").is("invitation_used_at", null).select("id").maybeSingle();
    if (error || !data) throw error ?? new Error("Demande indisponible.");
    return { status: "success", message: "Lien d’inscription régénéré", invitationUrl: invitation.url, invitationExpiresAt: invitation.expiresAt };
  } catch { return { status: "error", message: "Impossible de régénérer ce lien d’inscription." }; }
}

async function createAccountInvitation() {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return { tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt, url: `${await getApplicationOrigin()}/inscription?token=${encodeURIComponent(token)}` };
}

export async function validateSignupInvitation(token: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const [requestResult, dossierResult] = await Promise.all([
    admin.from("account_requests").select("id,email,first_name,last_name").eq("invitation_token_hash", tokenHash).eq("status", "approved").is("invitation_used_at", null).gt("invitation_expires_at", now).maybeSingle(),
    admin.from("protected_person_invitations").select("id,email").eq("token_hash", tokenHash).is("accepted_at", null).gt("expires_at", now).maybeSingle(),
  ]);
  if (requestResult.data) return { kind: "account" as const, ...requestResult.data };
  if (dossierResult.data) return { kind: "dossier" as const, ...dossierResult.data, first_name: "", last_name: "" };
  return null;
}

export async function markSignupInvitationUsed(token: string) {
  const admin = createAdminClient();
  await admin.from("account_requests").update({ invitation_used_at: new Date().toISOString() }).eq("invitation_token_hash", createHash("sha256").update(token).digest("hex")).is("invitation_used_at", null);
}

export async function inviteCollaboratorAction(protectedPersonId: string, _state: AccessActionState, formData: FormData): Promise<AccessActionState> {
  try {
    const input = z.object({ email: z.email().trim().toLowerCase(), role: z.enum(["manager", "read_only"]) }).parse({ email: formData.get("email"), role: formData.get("role") });
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (!userId) throw new Error();
    const { data: owner } = await supabase.from("protected_persons").select("id").eq("id", protectedPersonId).eq("owner_id", userId).maybeSingle();
    if (!owner) throw new Error();
    const token = randomBytes(32).toString("base64url");
    const { error } = await supabase.from("protected_person_invitations").insert({ protected_person_id: protectedPersonId, email: input.email, role: input.role, token_hash: createHash("sha256").update(token).digest("hex"), expires_at: new Date(Date.now() + 604800000).toISOString(), invited_by: userId });
    if (error?.code === "23505") return { status: "error", message: "Une invitation est déjà en attente pour cette adresse." };
    if (error) throw error;
    revalidatePath(`/dossiers/${protectedPersonId}/acces`);
    return { status: "success", message: "Invitation créée. Transmettez ce lien au collaborateur.", invitationUrl: `${await getApplicationOrigin()}/invitation/${encodeURIComponent(token)}` };
  } catch { return { status: "error", message: "Impossible de créer cette invitation." }; }
}

export async function acceptDossierInvitationAction(token: string): Promise<void> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) throw new Error("Authentification requise.");
  const { data: administrator } = await supabase.from("platform_administrators").select("user_id").eq("user_id", userId).maybeSingle();
  if (administrator) throw new Error("Un administrateur de plateforme ne peut pas accepter une invitation métier.");
  const { data, error } = await supabase.rpc("accept_protected_person_invitation", { p_token_hash: createHash("sha256").update(token).digest("hex") });
  if (error || !data) throw new Error("Invitation invalide ou expirée.");
  revalidatePath("/dossiers");
  const { redirect } = await import("next/navigation");
  redirect(`/dossiers/${data}/comptes`);
}

export async function updateCollaboratorRoleAction(protectedPersonId: string, formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const role = z.enum(["manager", "read_only"]).parse(formData.get("role"));
  const supabase = await createClient();
  const { error } = await supabase.from("protected_person_access").update({ role }).eq("id", id).eq("protected_person_id", protectedPersonId);
  if (error) throw new Error("Impossible de modifier ce rôle.");
  revalidatePath(`/dossiers/${protectedPersonId}/acces`);
}

export async function removeCollaboratorAction(protectedPersonId: string, formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("protected_person_access").delete().eq("id", id).eq("protected_person_id", protectedPersonId);
  if (error) throw new Error("Impossible de retirer cet accès.");
  revalidatePath(`/dossiers/${protectedPersonId}/acces`);
}
