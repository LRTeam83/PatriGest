create table public.platform_administrators (
  user_id uuid primary key references auth.users(id) on delete restrict,
  appointed_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

comment on table public.platform_administrators is
  'Fondation du rôle platform_admin. Aucun droit financier supplémentaire n’est accordé. Les affectations sont réservées aux opérations privilégiées en base.';

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  usage text not null check (usage in ('income', 'expense', 'both')),
  is_system boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_owner_consistency check (
    (is_system and owner_id is null) or (not is_system and owner_id is not null)
  )
);

create unique index categories_system_name_unique_idx
  on public.categories (lower(name)) where is_system;
create unique index categories_owner_name_unique_idx
  on public.categories (owner_id, lower(name)) where not is_system;
create index categories_owner_id_idx on public.categories(owner_id);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

insert into public.categories (name, usage, is_system) values
  ('Retraite', 'income', true),
  ('Pension', 'income', true),
  ('Prestations sociales', 'income', true),
  ('Revenus locatifs', 'income', true),
  ('Intérêts', 'income', true),
  ('Remboursements', 'income', true),
  ('Autres recettes', 'income', true),
  ('Logement', 'expense', true),
  ('Hébergement / EHPAD', 'expense', true),
  ('Alimentation', 'expense', true),
  ('Santé', 'expense', true),
  ('Assurances', 'expense', true),
  ('Impôts', 'expense', true),
  ('Énergie', 'expense', true),
  ('Téléphone / Internet', 'expense', true),
  ('Transport', 'expense', true),
  ('Loisirs', 'expense', true),
  ('Banque', 'expense', true),
  ('Autres dépenses', 'expense', true),
  ('Remboursements et régularisations', 'both', true);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  source_account_id uuid not null references public.financial_accounts(id) on delete restrict,
  destination_account_id uuid not null references public.financial_accounts(id) on delete restrict,
  transfer_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  label text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfers_different_accounts check (source_account_id <> destination_account_id),
  constraint transfers_label_not_blank check (label is null or length(trim(label)) > 0)
);

create index transfers_protected_person_id_idx on public.transfers(protected_person_id);
create index transfers_source_account_id_idx on public.transfers(source_account_id);
create index transfers_destination_account_id_idx on public.transfers(destination_account_id);
create index transfers_transfer_date_idx on public.transfers(transfer_date);

create trigger transfers_set_updated_at
before update on public.transfers
for each row execute function public.set_updated_at();

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  financial_account_id uuid not null references public.financial_accounts(id) on delete restrict,
  transaction_date date not null,
  transaction_type text not null check (transaction_type in ('income', 'expense', 'transfer_in', 'transfer_out')),
  label text not null check (length(trim(label)) > 0),
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete restrict,
  transfer_id uuid references public.transfers(id) on delete restrict,
  proof_reference text,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_transfer_consistency check (
    (transaction_type in ('income', 'expense') and transfer_id is null)
    or (transaction_type in ('transfer_in', 'transfer_out') and transfer_id is not null and category_id is null)
  )
);

create index transactions_financial_account_id_idx on public.transactions(financial_account_id);
create index transactions_transaction_date_idx on public.transactions(transaction_date desc);
create index transactions_category_id_idx on public.transactions(category_id);
create index transactions_transfer_id_idx on public.transactions(transfer_id);

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create or replace function public.validate_financial_transaction()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  account_row public.financial_accounts%rowtype;
  category_row public.categories%rowtype;
begin
  select * into account_row from public.financial_accounts where id = new.financial_account_id;
  if not found then raise exception 'Compte introuvable.'; end if;
  if new.transaction_date < account_row.initial_balance_date
     or (account_row.opening_date is not null and new.transaction_date < account_row.opening_date)
     or (account_row.closing_date is not null and new.transaction_date > account_row.closing_date) then
    raise exception 'La date de l’opération est incompatible avec le compte.';
  end if;
  if new.category_id is not null then
    select * into category_row from public.categories where id = new.category_id;
    if not found or not category_row.active
       or (not category_row.is_system and category_row.owner_id <> auth.uid())
       or (new.transaction_type = 'income' and category_row.usage not in ('income', 'both'))
       or (new.transaction_type = 'expense' and category_row.usage not in ('expense', 'both')) then
      raise exception 'La catégorie est incompatible avec l’opération.';
    end if;
  end if;
  return new;
end;
$$;

create trigger transactions_validate
before insert or update on public.transactions
for each row execute function public.validate_financial_transaction();

create or replace function public.prevent_closed_period_transaction_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_person_id uuid;
  new_person_id uuid;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select protected_person_id into old_person_id
    from public.financial_accounts where id = old.financial_account_id;

    if exists (
      select 1 from public.management_periods
      where protected_person_id = old_person_id and status = 'closed'
        and old.transaction_date between start_date and end_date
    ) then
      raise exception 'Cette opération appartient à un exercice clôturé.';
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    select protected_person_id into new_person_id
    from public.financial_accounts where id = new.financial_account_id;

    if tg_op = 'UPDATE' and old_person_id <> new_person_id then
      raise exception 'Une opération ne peut pas être déplacée vers un autre dossier.';
    end if;

    if exists (
      select 1 from public.management_periods
      where protected_person_id = new_person_id and status = 'closed'
        and new.transaction_date between start_date and end_date
    ) then
      raise exception 'Cette date appartient à un exercice clôturé.';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger transactions_protect_closed_period
before insert or update or delete on public.transactions
for each row execute function public.prevent_closed_period_transaction_change();

alter table public.platform_administrators enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transfers enable row level security;

create policy "platform_administrators_select_own" on public.platform_administrators
for select to authenticated using (user_id = (select auth.uid()));

create policy "categories_select_available" on public.categories
for select to authenticated using ((is_system and active) or owner_id = (select auth.uid()));
create policy "categories_insert_own" on public.categories
for insert to authenticated with check (owner_id = (select auth.uid()) and not is_system);
create policy "categories_update_own" on public.categories
for update to authenticated using (owner_id = (select auth.uid()) and not is_system)
with check (owner_id = (select auth.uid()) and not is_system);
create policy "categories_delete_denied" on public.categories
for delete to authenticated using (false);

create policy "transactions_select_own" on public.transactions
for select to authenticated using (exists (
  select 1 from public.financial_accounts
  join public.protected_persons on protected_persons.id = financial_accounts.protected_person_id
  where financial_accounts.id = transactions.financial_account_id
    and protected_persons.owner_id = (select auth.uid())
));
create policy "transactions_insert_own_classic" on public.transactions
for insert to authenticated with check (
  transaction_type in ('income', 'expense') and transfer_id is null and exists (
    select 1 from public.financial_accounts
    join public.protected_persons on protected_persons.id = financial_accounts.protected_person_id
    where financial_accounts.id = transactions.financial_account_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "transactions_update_own_classic" on public.transactions
for update to authenticated using (
  transaction_type in ('income', 'expense') and transfer_id is null and exists (
    select 1 from public.financial_accounts
    join public.protected_persons on protected_persons.id = financial_accounts.protected_person_id
    where financial_accounts.id = transactions.financial_account_id
      and protected_persons.owner_id = (select auth.uid())
  )
) with check (
  transaction_type in ('income', 'expense') and transfer_id is null and exists (
    select 1 from public.financial_accounts
    join public.protected_persons on protected_persons.id = financial_accounts.protected_person_id
    where financial_accounts.id = transactions.financial_account_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "transactions_delete_own_classic" on public.transactions
for delete to authenticated using (
  transaction_type in ('income', 'expense') and transfer_id is null and exists (
    select 1 from public.financial_accounts
    join public.protected_persons on protected_persons.id = financial_accounts.protected_person_id
    where financial_accounts.id = transactions.financial_account_id
      and protected_persons.owner_id = (select auth.uid())
  )
);

create policy "transfers_select_own" on public.transfers
for select to authenticated using (exists (
  select 1 from public.protected_persons
  where protected_persons.id = transfers.protected_person_id
    and protected_persons.owner_id = (select auth.uid())
));

create or replace function public.create_internal_transfer(
  p_protected_person_id uuid,
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_transfer_date date,
  p_amount numeric,
  p_label text default null,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  source_account public.financial_accounts%rowtype;
  destination_account public.financial_accounts%rowtype;
  transfer_uuid uuid;
  movement_label text := coalesce(nullif(trim(p_label), ''), 'Virement interne');
begin
  if caller_id is null then raise exception 'Authentification requise.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Le montant doit être positif.'; end if;
  if p_source_account_id = p_destination_account_id then raise exception 'Les comptes doivent être différents.'; end if;
  if not exists (select 1 from public.protected_persons where id = p_protected_person_id and owner_id = caller_id) then
    raise exception 'Dossier introuvable.';
  end if;
  select * into source_account from public.financial_accounts where id = p_source_account_id for update;
  select * into destination_account from public.financial_accounts where id = p_destination_account_id for update;
  if source_account.id is null or destination_account.id is null
     or source_account.protected_person_id <> p_protected_person_id
     or destination_account.protected_person_id <> p_protected_person_id then
    raise exception 'Comptes incompatibles avec le dossier.';
  end if;
  if p_transfer_date < source_account.initial_balance_date
     or (source_account.opening_date is not null and p_transfer_date < source_account.opening_date)
     or (source_account.closing_date is not null and p_transfer_date > source_account.closing_date)
     or p_transfer_date < destination_account.initial_balance_date
     or (destination_account.opening_date is not null and p_transfer_date < destination_account.opening_date)
     or (destination_account.closing_date is not null and p_transfer_date > destination_account.closing_date) then
    raise exception 'La date du virement est incompatible avec un compte.';
  end if;
  if exists (
    select 1 from public.management_periods
    where protected_person_id = p_protected_person_id and status = 'closed'
      and p_transfer_date between start_date and end_date
  ) then
    raise exception 'Cette date appartient à un exercice clôturé.';
  end if;
  insert into public.transfers (protected_person_id, source_account_id, destination_account_id, transfer_date, amount, label, comment)
  values (p_protected_person_id, p_source_account_id, p_destination_account_id, p_transfer_date, p_amount, nullif(trim(p_label), ''), nullif(trim(p_comment), ''))
  returning id into transfer_uuid;
  insert into public.transactions (financial_account_id, transaction_date, transaction_type, label, amount, transfer_id, comment)
  values
    (p_source_account_id, p_transfer_date, 'transfer_out', movement_label, p_amount, transfer_uuid, nullif(trim(p_comment), '')),
    (p_destination_account_id, p_transfer_date, 'transfer_in', movement_label, p_amount, transfer_uuid, nullif(trim(p_comment), ''));
  return transfer_uuid;
end;
$$;

create or replace function public.delete_internal_transfer(p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare transfer_row public.transfers%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  select * into transfer_row from public.transfers where id = p_transfer_id for update;
  if not found or not exists (
    select 1 from public.protected_persons
    where id = transfer_row.protected_person_id and owner_id = auth.uid()
  ) then raise exception 'Virement introuvable.'; end if;
  if exists (
    select 1 from public.management_periods
    where protected_person_id = transfer_row.protected_person_id and status = 'closed'
      and transfer_row.transfer_date between start_date and end_date
  ) then raise exception 'Ce virement appartient à un exercice clôturé.'; end if;
  delete from public.transactions where transfer_id = p_transfer_id;
  delete from public.transfers where id = p_transfer_id;
end;
$$;

revoke all on public.platform_administrators from authenticated;
grant select on public.platform_administrators to authenticated;
grant select, insert, update on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select on public.transfers to authenticated;
revoke all on function public.create_internal_transfer(uuid, uuid, uuid, date, numeric, text, text) from public;
revoke all on function public.delete_internal_transfer(uuid) from public;
grant execute on function public.create_internal_transfer(uuid, uuid, uuid, date, numeric, text, text) to authenticated;
grant execute on function public.delete_internal_transfer(uuid) to authenticated;
