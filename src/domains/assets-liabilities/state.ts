export type AssetLiabilityActionState = { status: "idle" | "error" | "success"; message: string; fieldErrors?: Record<string, string[]> };
export const initialAssetLiabilityState: AssetLiabilityActionState = { status: "idle", message: "" };
