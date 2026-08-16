import type {
  AccountValuation,
  Category,
  FinancialAccount,
  Transaction,
} from "@/types/database";
import { isValuationAccount } from "@/domains/financial-accounts/utils/financial-account-utils";
import {
  resolveCategoryReference,
  resolveTransferOfficialCodeForFutureReport,
} from "@/domains/categories/category-reference";
export type ReportLine = {
  officialCode: string;
  label: string;
  amount: number;
  order: number;
};
export type ReportAccountSituation = {
  account: FinancialAccount;
  startBalance: number | null;
  income: number;
  expense: number;
  endBalance: number | null;
  reliable: boolean;
};
const sum = (items: Transaction[], credit: boolean) =>
  items
    .filter((item) =>
      credit
        ? ["income", "transfer_in"].includes(item.transaction_type)
        : ["expense", "transfer_out"].includes(item.transaction_type),
    )
    .reduce((total, item) => total + item.amount, 0);
export function aggregateReportOperations(
  transactions: Transaction[],
  categories: Category[],
  accounts: FinancialAccount[],
) {
  const official = categories.filter(
    (category) => category.is_system && category.official_code,
  );
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const lines = new Map<string, ReportLine>();
  let unclassified = 0;
  for (const item of transactions) {
    let category: Category | undefined;
    let code: string | null = null;
    if (
      item.transaction_type === "income" ||
      item.transaction_type === "expense"
    ) {
      category = item.category_id
        ? categoryById.get(item.category_id)
        : undefined;
      if (category)
        code =
          resolveCategoryReference(category, official)?.officialCode ?? null;
    } else {
      const account = accountById.get(item.financial_account_id);
      if (account)
        code = resolveTransferOfficialCodeForFutureReport({
          transactionType: item.transaction_type,
          accountType: account.account_type,
        });
    }
    if (!code) {
      if (item.transaction_type === "income" || item.transaction_type === "expense") unclassified += 1;
      continue;
    }
    const officialCategory = official.find(
      (entry) => entry.official_code === code,
    );
    const current = lines.get(code);
    lines.set(code, {
      officialCode: code,
      label: officialCategory?.name ?? "Versement sur placement",
      amount: (current?.amount ?? 0) + item.amount,
      order: officialCategory?.official_order ?? 9999,
    });
  }
  const ordered = [...lines.values()].sort(
    (a, b) => a.order - b.order || a.officialCode.localeCompare(b.officialCode),
  );
  return {
    resources: ordered.filter((line) => line.officialCode.startsWith("RES-")),
    expenses: ordered.filter((line) => line.officialCode.startsWith("DEP-")),
    unclassified,
  };
}
export function calculateAccountSituations(
  accounts: FinancialAccount[],
  transactions: Transaction[],
  valuations: AccountValuation[],
  start: string,
  end: string,
): ReportAccountSituation[] {
  return accounts
    .filter(
      (account) =>
        (!account.opening_date || account.opening_date <= end) &&
        (!account.closing_date || account.closing_date >= start),
    )
    .map((account) => {
      const movements = transactions.filter(
        (item) => item.financial_account_id === account.id,
      );
      if (isValuationAccount(account.account_type)) {
        const before = (date: string) =>
          valuations
            .filter(
              (value) =>
                value.financial_account_id === account.id &&
                value.valuation_date <= date,
            )
            .sort((a, b) => b.valuation_date.localeCompare(a.valuation_date))[0]
            ?.value ??
          (account.initial_balance_date <= date
            ? account.initial_balance
            : null);
        return {
          account,
          startBalance: before(start),
          income: 0,
          expense: 0,
          endBalance: before(end),
          reliable: before(start) !== null && before(end) !== null,
        };
      }
      if (account.initial_balance_date > start)
        return {
          account,
          startBalance: null,
          income: 0,
          expense: 0,
          endBalance: null,
          reliable: false,
        };
      const beforeStart = movements.filter(
        (item) => item.transaction_date < start,
      );
      const inPeriod = movements.filter(
        (item) =>
          item.transaction_date >= start && item.transaction_date <= end,
      );
      const startBalance =
        account.initial_balance +
        sum(beforeStart, true) -
        sum(beforeStart, false);
      return {
        account,
        startBalance,
        income: sum(inPeriod, true),
        expense: sum(inPeriod, false),
        endBalance: startBalance + sum(inPeriod, true) - sum(inPeriod, false),
        reliable: true,
      };
    });
}
