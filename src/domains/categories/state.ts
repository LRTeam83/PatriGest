import type { AuthActionState } from "@/lib/auth/state";

export type CategoryActionState = AuthActionState;

export const initialCategoryState: CategoryActionState = {
  status: "idle",
  message: "",
};
