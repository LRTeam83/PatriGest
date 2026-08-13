export type DeleteUserState = { status: "idle" | "error" | "success"; message: string };
export const initialDeleteUserState: DeleteUserState = { status: "idle", message: "" };
