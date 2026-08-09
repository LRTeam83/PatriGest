import type { AuthActionState } from "@/lib/auth/state";

export type TransactionActionState = AuthActionState;

export const initialTransactionState: TransactionActionState = {
  status: "idle",
  message: "",
};
