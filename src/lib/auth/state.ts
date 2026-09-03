export type AuthActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Record<string, string[]>;
  redirectTo?: string;
  email?: string;
};

export const initialAuthState: AuthActionState = {
  status: "idle",
  message: "",
};
