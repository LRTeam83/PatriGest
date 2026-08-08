export type FinancialAccountActionState = { status: "idle" | "error" | "success"; message: string; fieldErrors?: Record<string, string[]> };
export const initialFinancialAccountState: FinancialAccountActionState = { status: "idle", message: "" };
