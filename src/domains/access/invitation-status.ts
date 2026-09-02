import type { ProtectedPersonInvitation } from "@/types/database";

export type DossierInvitationStatus =
  | "pending"
  | "expired"
  | "accepted"
  | "revoked";

export const dossierInvitationStatusLabels: Record<
  DossierInvitationStatus,
  string
> = {
  pending: "En attente",
  expired: "Expirée",
  accepted: "Acceptée",
  revoked: "Annulée",
};

export function getDossierInvitationStatus(
  invitation: Pick<
    ProtectedPersonInvitation,
    "accepted_at" | "revoked_at" | "expires_at"
  >,
  now = new Date(),
): DossierInvitationStatus {
  if (invitation.accepted_at) return "accepted";
  if (invitation.revoked_at) return "revoked";
  return new Date(invitation.expires_at) <= now ? "expired" : "pending";
}
