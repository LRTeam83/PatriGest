export const MANAGEMENT_REPORT_BUCKET = "management-reports";

export type ManagementReportPdfMode = "draft" | "final";

export function managementReportStoragePath(personId: string, reportId: string, mode: ManagementReportPdfMode) {
  const file = mode === "draft" ? "management-report-draft.pdf" : "management-report.pdf";
  return `protected-persons/${personId}/management-reports/${reportId}/${file}`;
}

export function managementReportDownloadName(year: number, firstName: string, lastName: string, mode: ManagementReportPdfMode) {
  const safe = (input: string) => input.normalize("NFKC").replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ").replace(/\s+/g, " ").trim();
  const prefix = mode === "draft" ? "PROJET - " : "";
  return `${prefix}Compte de gestion ${year} - ${safe(`${firstName} ${lastName}`) || "Personne protégée"}.pdf`;
}

export function managementReportContentDisposition(name: string, download: boolean) {
  const fallback = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(name).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${download ? "attachment" : "inline"}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
