export type ManagementReportStatusActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialManagementReportStatusState: ManagementReportStatusActionState = {
  status: "idle",
  message: "",
};
