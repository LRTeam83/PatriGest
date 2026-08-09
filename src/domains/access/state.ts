export type AccessActionState = { status: "idle" | "success" | "error"; message?: string; invitationUrl?: string; invitationExpiresAt?: string; fieldErrors?: Record<string, string[]> };
export const initialAccessState: AccessActionState = { status: "idle" };
