import type { AuthActionState } from "@/lib/auth/state";

export type AccountActionState = AuthActionState;

export const initialAccountState: AccountActionState = {
  status: "idle",
  message: "",
};
