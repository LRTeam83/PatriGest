export type ProtectedPersonActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialProtectedPersonState: ProtectedPersonActionState = { status: "idle", message: "" };
