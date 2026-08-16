export type ReportSectionKey="person"|"measure"|"acts"|"operations"|"accounts"|"statements"|"debts"|"observations";
export type ReportSectionCompleteness={key:ReportSectionKey;label:string;complete:boolean;missing:string[]};
export function getManagementReportCompleteness(sections:ReportSectionCompleteness[]){return{complete:sections.every(section=>section.complete),sections};}
