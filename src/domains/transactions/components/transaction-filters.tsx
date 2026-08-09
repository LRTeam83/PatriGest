import type { Category } from "@/types/database";
import type { FinancialAccountWithValuations } from "@/domains/financial-accounts/services/financial-account-service";
import { formatCurrency, getCurrentAccountValue } from "@/domains/financial-accounts/utils/financial-account-utils";

export function TransactionFilters({ accounts, categories }: { accounts: FinancialAccountWithValuations[]; categories: Category[] }) {
  const activeAccounts = accounts.filter((account) => account.status === "active");

  return <>
    <section className="mt-6" aria-labelledby="current-balances-title">
      <h2 id="current-balances-title" className="text-sm font-bold text-[#334155]">Soldes actuels</h2>
      {activeAccounts.length > 0 ? <div className="mt-3 overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.03)] [scrollbar-width:thin]">
        <div className="flex min-w-max divide-x divide-[#E2E8F0]">
          {activeAccounts.map((account) => {
            const current = getCurrentAccountValue(account, account.valuations, account.transactions);
            return <div key={account.id} className="w-48 shrink-0 px-4 py-3 sm:w-56 sm:px-5">
              <p className="truncate text-xs font-semibold text-[#64748B]" title={account.account_name}>{account.account_name}</p>
              <p className="mt-1 whitespace-nowrap text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">{formatCurrency(current.value)}</p>
            </div>;
          })}
        </div>
      </div> : <p className="mt-3 rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#64748B]">Aucun compte actif.</p>}
    </section>

    <form className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input className="auth-input" name="start" type="date" aria-label="Date de début" />
        <input className="auth-input" name="end" type="date" aria-label="Date de fin" />
        <select className="auth-input" name="account" aria-label="Compte"><option value="">Tous les comptes</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}</select>
        <select className="auth-input" name="type" aria-label="Type"><option value="">Tous les types</option><option value="income">Recettes</option><option value="expense">Dépenses</option><option value="transfer">Virements</option></select>
        <select className="auth-input" name="category" aria-label="Catégorie"><option value="">Toutes catégories</option>{categories.filter((category) => category.active).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <input className="auth-input" name="q" placeholder="Rechercher…" aria-label="Rechercher par libellé" />
      </div>
      <div className="mt-3 flex justify-end gap-3"><a className="button button-secondary" href="?">Effacer</a><button className="button button-primary" type="submit">Filtrer</button></div>
    </form>
  </>;
}
