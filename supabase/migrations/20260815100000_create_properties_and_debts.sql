create table public.real_estate_properties (
  id uuid primary key default gen_random_uuid(),
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  property_type text not null check (property_type in ('house', 'apartment', 'land', 'commercial', 'other')),
  designation text not null check (char_length(trim(designation)) between 1 and 200),
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text not null default 'France',
  entry_date date,
  entry_mode text check (entry_mode is null or entry_mode in ('acquisition', 'inheritance', 'donation', 'other')),
  estimated_value numeric(15,2) check (estimated_value is null or estimated_value >= 0),
  valuation_date date,
  status text not null default 'active' check (status in ('active', 'disposed')),
  disposal_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint real_estate_properties_value_date_consistency check (
    (estimated_value is null and valuation_date is null) or estimated_value is not null
  )
);

create table public.property_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.real_estate_properties(id) on delete restrict,
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  event_type text not null check (event_type in ('acquisition', 'sale', 'inheritance', 'donation', 'significant_change')),
  event_date date not null,
  description text not null check (char_length(trim(description)) between 1 and 2000),
  amount numeric(15,2) check (amount is null or amount >= 0),
  document_reference text,
  created_at timestamptz not null default now()
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  creditor text not null check (char_length(trim(creditor)) between 1 and 200),
  debt_type text not null check (debt_type in ('bank_loan', 'tax_debt', 'institution_debt', 'personal_debt', 'other')),
  designation text not null check (char_length(trim(designation)) between 1 and 200),
  start_date date,
  initial_amount numeric(15,2) check (initial_amount is null or initial_amount >= 0),
  initial_duration_months integer check (initial_duration_months is null or initial_duration_months >= 0),
  monthly_payment numeric(15,2) check (monthly_payment is null or monthly_payment >= 0),
  interest_rate numeric(7,4) check (interest_rate is null or interest_rate >= 0),
  current_balance numeric(15,2) check (current_balance is null or current_balance >= 0),
  current_balance_date date,
  remaining_duration_months integer check (remaining_duration_months is null or remaining_duration_months >= 0),
  status text not null default 'active' check (status in ('active', 'settled')),
  settled_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_current_balance_date_consistency check (
    (current_balance is null and current_balance_date is null) or current_balance is not null
  )
);

create table public.debt_balances (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts(id) on delete restrict,
  balance_date date not null,
  remaining_balance numeric(15,2) not null check (remaining_balance >= 0),
  remaining_duration_months integer check (remaining_duration_months is null or remaining_duration_months >= 0),
  created_at timestamptz not null default now(),
  unique (debt_id, balance_date)
);

create index real_estate_properties_person_status_idx on public.real_estate_properties(protected_person_id, status);
create index property_events_property_date_idx on public.property_events(property_id, event_date desc);
create index property_events_person_date_idx on public.property_events(protected_person_id, event_date desc);
create index debts_person_status_idx on public.debts(protected_person_id, status);
create index debt_balances_debt_date_idx on public.debt_balances(debt_id, balance_date desc);

create trigger real_estate_properties_set_updated_at before update on public.real_estate_properties
for each row execute function public.set_updated_at();
create trigger debts_set_updated_at before update on public.debts
for each row execute function public.set_updated_at();

create or replace function public.sync_debt_current_balance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest_balance public.debt_balances%rowtype;
begin
  select balance.*
  into latest_balance
  from public.debt_balances balance
  where balance.debt_id = new.debt_id
  order by balance.balance_date desc, balance.created_at desc, balance.id desc
  limit 1;

  update public.debts
  set current_balance = latest_balance.remaining_balance,
      current_balance_date = latest_balance.balance_date,
      remaining_duration_months = latest_balance.remaining_duration_months
  where id = new.debt_id;

  return new;
end;
$$;

create trigger debt_balances_sync_current_balance
after insert or update on public.debt_balances
for each row execute function public.sync_debt_current_balance();

create or replace function public.protect_property_and_debt_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_table_name in ('real_estate_properties', 'debts')
     and new.protected_person_id <> old.protected_person_id then
    raise exception 'Le rattachement au dossier ne peut pas être modifié.';
  end if;
  if tg_table_name = 'property_events'
     and (new.property_id, new.protected_person_id) is distinct from (old.property_id, old.protected_person_id) then
    raise exception 'Le rattachement de l’événement ne peut pas être modifié.';
  end if;
  if tg_table_name = 'debt_balances' and new.debt_id <> old.debt_id then
    raise exception 'Le rattachement de la situation ne peut pas être modifié.';
  end if;
  return new;
end;
$$;

create trigger real_estate_properties_protect_identity before update on public.real_estate_properties
for each row execute function public.protect_property_and_debt_identity();
create trigger property_events_protect_identity before update on public.property_events
for each row execute function public.protect_property_and_debt_identity();
create trigger debts_protect_identity before update on public.debts
for each row execute function public.protect_property_and_debt_identity();
create trigger debt_balances_protect_identity before update on public.debt_balances
for each row execute function public.protect_property_and_debt_identity();

create or replace function public.validate_property_event_dossier()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.real_estate_properties
    where id = new.property_id and protected_person_id = new.protected_person_id
  ) then raise exception 'Le bien immobilier n’appartient pas à ce dossier.'; end if;
  return new;
end;
$$;
create trigger property_events_validate_dossier before insert or update on public.property_events
for each row execute function public.validate_property_event_dossier();

alter table public.real_estate_properties enable row level security;
alter table public.property_events enable row level security;
alter table public.debts enable row level security;
alter table public.debt_balances enable row level security;

create policy "real_estate_properties_select_accessible" on public.real_estate_properties
for select to authenticated using (public.can_read_protected_person(protected_person_id));
create policy "real_estate_properties_insert_manage" on public.real_estate_properties
for insert to authenticated with check (public.can_manage_protected_person(protected_person_id));
create policy "real_estate_properties_update_manage" on public.real_estate_properties
for update to authenticated using (public.can_manage_protected_person(protected_person_id))
with check (public.can_manage_protected_person(protected_person_id));

create policy "property_events_select_accessible" on public.property_events
for select to authenticated using (public.can_read_protected_person(protected_person_id));
create policy "property_events_insert_manage" on public.property_events
for insert to authenticated with check (public.can_manage_protected_person(protected_person_id));
create policy "property_events_update_manage" on public.property_events
for update to authenticated using (public.can_manage_protected_person(protected_person_id))
with check (public.can_manage_protected_person(protected_person_id));

create policy "debts_select_accessible" on public.debts
for select to authenticated using (public.can_read_protected_person(protected_person_id));
create policy "debts_insert_manage" on public.debts
for insert to authenticated with check (public.can_manage_protected_person(protected_person_id));
create policy "debts_update_manage" on public.debts
for update to authenticated using (public.can_manage_protected_person(protected_person_id))
with check (public.can_manage_protected_person(protected_person_id));

create policy "debt_balances_select_accessible" on public.debt_balances
for select to authenticated using (exists (
  select 1 from public.debts debt
  where debt.id = debt_balances.debt_id
    and public.can_read_protected_person(debt.protected_person_id)
));
create policy "debt_balances_insert_manage" on public.debt_balances
for insert to authenticated with check (exists (
  select 1 from public.debts debt
  where debt.id = debt_balances.debt_id
    and public.can_manage_protected_person(debt.protected_person_id)
));
create policy "debt_balances_update_manage" on public.debt_balances
for update to authenticated using (exists (
  select 1 from public.debts debt
  where debt.id = debt_balances.debt_id
    and public.can_manage_protected_person(debt.protected_person_id)
)) with check (exists (
  select 1 from public.debts debt
  where debt.id = debt_balances.debt_id
    and public.can_manage_protected_person(debt.protected_person_id)
));

grant select, insert, update on public.real_estate_properties to authenticated;
grant select, insert, update on public.property_events to authenticated;
grant select on public.debts to authenticated;
grant insert (
  protected_person_id,
  creditor,
  debt_type,
  designation,
  start_date,
  initial_amount,
  initial_duration_months,
  monthly_payment,
  interest_rate,
  status,
  settled_at,
  notes
) on public.debts to authenticated;
grant update (
  creditor,
  debt_type,
  designation,
  start_date,
  initial_amount,
  initial_duration_months,
  monthly_payment,
  interest_rate,
  status,
  settled_at,
  notes
) on public.debts to authenticated;
grant select, insert, update on public.debt_balances to authenticated;

revoke all on function public.sync_debt_current_balance() from public;
