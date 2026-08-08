create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  account_type text not null check (account_type in ('checking', 'livret_a', 'ldds', 'csl', 'lep', 'pel', 'term_account', 'life_insurance', 'other_investment')),
  institution_name text not null check (length(trim(institution_name)) > 0),
  account_name text not null check (length(trim(account_name)) > 0),
  account_reference text,
  opening_date date,
  closing_date date,
  initial_balance numeric(14,2) not null default 0,
  initial_balance_date date not null,
  notes text,
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_accounts_status_consistency check (
    (status = 'active' and closing_date is null)
    or (status = 'closed' and closing_date is not null)
  ),
  constraint financial_accounts_date_order check (
    opening_date is null or closing_date is null or closing_date >= opening_date
  ),
  constraint financial_accounts_closing_after_initial_balance check (
    closing_date is null or closing_date >= initial_balance_date
  )
);

create index financial_accounts_protected_person_id_idx
  on public.financial_accounts(protected_person_id);

create trigger financial_accounts_set_updated_at
before update on public.financial_accounts
for each row execute function public.set_updated_at();

create table public.account_valuations (
  id uuid primary key default gen_random_uuid(),
  financial_account_id uuid not null references public.financial_accounts(id) on delete restrict,
  valuation_date date not null,
  value numeric(14,2) not null check (value >= 0),
  comment text,
  created_at timestamptz not null default now(),
  constraint account_valuations_unique_date unique (financial_account_id, valuation_date)
);

create index account_valuations_financial_account_id_idx
  on public.account_valuations(financial_account_id);

alter table public.financial_accounts enable row level security;
alter table public.account_valuations enable row level security;

create policy "financial_accounts_select_own" on public.financial_accounts
for select to authenticated using (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = financial_accounts.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "financial_accounts_insert_own" on public.financial_accounts
for insert to authenticated with check (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = financial_accounts.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "financial_accounts_update_own" on public.financial_accounts
for update to authenticated
using (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = financial_accounts.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = financial_accounts.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "financial_accounts_delete_denied" on public.financial_accounts
for delete to authenticated using (false);

create policy "account_valuations_select_own" on public.account_valuations
for select to authenticated using (
  exists (
    select 1
    from public.financial_accounts
    join public.protected_persons on protected_persons.id = financial_accounts.protected_person_id
    where financial_accounts.id = account_valuations.financial_account_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "account_valuations_insert_own" on public.account_valuations
for insert to authenticated with check (
  exists (
    select 1
    from public.financial_accounts
    join public.protected_persons on protected_persons.id = financial_accounts.protected_person_id
    where financial_accounts.id = account_valuations.financial_account_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "account_valuations_update_own" on public.account_valuations
for update to authenticated
using (
  exists (
    select 1
    from public.financial_accounts
    join public.protected_persons on protected_persons.id = financial_accounts.protected_person_id
    where financial_accounts.id = account_valuations.financial_account_id
      and protected_persons.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.financial_accounts
    join public.protected_persons on protected_persons.id = financial_accounts.protected_person_id
    where financial_accounts.id = account_valuations.financial_account_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "account_valuations_delete_denied" on public.account_valuations
for delete to authenticated using (false);

grant select, insert, update on public.financial_accounts to authenticated;
grant select, insert, update on public.account_valuations to authenticated;
