export type DeleteUserState = { status: "idle" | "error" | "success"; message: string };
export const initialDeleteUserState: DeleteUserState = { status: "idle", message: "" };

export type RegistrationReviewState = {
  status: "idle" | "error" | "success" | "warning";
  message: string;
  decision?: "active" | "rejected";
};

export const initialRegistrationReviewState: RegistrationReviewState = { status: "idle", message: "" };
