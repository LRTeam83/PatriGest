export type AccessActionState = { status: "idle" | "success" | "warning" | "error"; message?: string; invitationUrl?: string; invitationExpiresAt?: string; fieldErrors?: Record<string, string[]> };
export const initialAccessState: AccessActionState = { status: "idle" };
