create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.protected_persons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  birth_name text,
  birth_date date,
  birth_place text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text not null default 'France',
  phone text,
  email text,
  notes text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint protected_persons_archive_consistency check (
    (status = 'active' and archived_at is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create table public.protection_measures (
  id uuid primary key default gen_random_uuid(),
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  measure_type text not null check (measure_type in (
    'safeguard_of_justice',
    'simple_curatorship',
    'reinforced_curatorship',
    'guardianship',
    'future_protection_mandate',
    'family_authorization'
  )),
  start_date date,
  end_date date,
  decision_date date,
  court_name text,
  court_city text,
  case_reference text,
  judge_name text,
  notary_name text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint protection_measures_date_order check (
    end_date is null or start_date is null or end_date >= start_date
  )
);

create table public.management_periods (
  id uuid primary key default gen_random_uuid(),
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint management_periods_date_order check (end_date >= start_date),
  constraint management_periods_closed_consistency check (
    (status = 'open' and closed_at is null)
    or (status = 'closed' and closed_at is not null)
  )
);

create index protected_persons_owner_id_idx on public.protected_persons(owner_id);
create index protection_measures_person_id_idx on public.protection_measures(protected_person_id);
create unique index protection_measures_one_active_idx
  on public.protection_measures(protected_person_id)
  where active;
create index management_periods_person_id_idx on public.management_periods(protected_person_id);
create unique index management_periods_unique_dates_idx
  on public.management_periods(protected_person_id, start_date, end_date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger protected_persons_set_updated_at
before update on public.protected_persons
for each row execute function public.set_updated_at();

create trigger protection_measures_set_updated_at
before update on public.protection_measures
for each row execute function public.set_updated_at();

create or replace function public.deactivate_previous_protection_measure()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.active then
    update public.protection_measures
    set active = false
    where protected_person_id = new.protected_person_id
      and active
      and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger protection_measures_keep_one_active
before insert or update of active on public.protection_measures
for each row execute function public.deactivate_previous_protection_measure();

create trigger management_periods_set_updated_at
before update on public.management_periods
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, first_name, last_name)
select
  id,
  nullif(trim(raw_user_meta_data ->> 'first_name'), ''),
  nullif(trim(raw_user_meta_data ->> 'last_name'), '')
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.protected_persons enable row level security;
alter table public.protection_measures enable row level security;
alter table public.management_periods enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));
create policy "profiles_delete_denied" on public.profiles
for delete to authenticated using (false);

create policy "protected_persons_select_own" on public.protected_persons
for select to authenticated using (owner_id = (select auth.uid()));
create policy "protected_persons_insert_own" on public.protected_persons
for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "protected_persons_update_own" on public.protected_persons
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
create policy "protected_persons_delete_denied" on public.protected_persons
for delete to authenticated using (false);

create policy "protection_measures_select_own" on public.protection_measures
for select to authenticated using (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = protection_measures.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "protection_measures_insert_own" on public.protection_measures
for insert to authenticated with check (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = protection_measures.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "protection_measures_update_own" on public.protection_measures
for update to authenticated
using (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = protection_measures.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = protection_measures.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "protection_measures_delete_denied" on public.protection_measures
for delete to authenticated using (false);

create policy "management_periods_select_own" on public.management_periods
for select to authenticated using (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = management_periods.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "management_periods_insert_own" on public.management_periods
for insert to authenticated with check (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = management_periods.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "management_periods_update_own" on public.management_periods
for update to authenticated
using (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = management_periods.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.protected_persons
    where protected_persons.id = management_periods.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);
create policy "management_periods_delete_open_own" on public.management_periods
for delete to authenticated using (
  status = 'open'
  and exists (
    select 1 from public.protected_persons
    where protected_persons.id = management_periods.protected_person_id
      and protected_persons.owner_id = (select auth.uid())
  )
);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.protected_persons to authenticated;
grant select, insert, update, delete on public.protection_measures to authenticated;
grant select, insert, update, delete on public.management_periods to authenticated;
