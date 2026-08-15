import { z } from "zod";
const optionalDate=z.string().trim().transform(v=>v||null).refine(v=>v===null||/^\d{4}-\d{2}-\d{2}$/.test(v),"Date invalide.");
const optionalAmount=z.string().trim().transform(v=>v?Number(v.replace(",",".")):null).refine(v=>v===null||Number.isFinite(v)&&Math.abs(v)<1_000_000_000_000,"Solde invalide.");
export const bankStatementSchema=z.object({statementStartDate:optionalDate,statementEndDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"Date de fin invalide."),statementBalance:optionalAmount,note:z.string().trim().max(2000).transform(v=>v||null)}).refine(v=>v.statementStartDate===null||v.statementStartDate<=v.statementEndDate,{path:["statementStartDate"],message:"La date de début doit précéder la date de fin."});
export type BankStatementInput=z.infer<typeof bankStatementSchema>;
