create type public.management_report_status as enum ('draft', 'ready', 'generated', 'transmitted', 'approved', 'difficulty');

create table public.management_reports (
  id uuid primary key default gen_random_uuid(),
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  management_period_id uuid references public.management_periods(id) on delete restrict,
  report_year integer not null check (report_year between 1900 and 2200),
  period_start date not null,
  period_end date not null,
  status public.management_report_status not null default 'draft',
  residence_changed boolean,
  representative_address_changed boolean,
  real_estate_confirmed boolean,
  financial_investments_confirmed boolean,
  observations text,
  signature_place text,
  generated_at timestamptz,
  transmitted_at timestamptz,
  approved_at timestamptz,
  difficulty_reported_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint management_reports_period_order check (period_start <= period_end),
  constraint management_reports_same_calendar_year check (
    extract(year from period_start) = extract(year from period_end)
  ),
  constraint management_reports_period_ends_on_december_31 check (
    period_end = make_date(extract(year from period_end)::integer, 12, 31)
  ),
  constraint management_reports_year_matches_period check (
    report_year = extract(year from period_end)::integer
  ),
  constraint management_reports_period_unique unique (protected_person_id, period_start, period_end)
);

create index management_reports_person_period_idx on public.management_reports(protected_person_id, period_end desc);

create or replace function public.protect_management_report_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status not in ('draft', 'ready') then
    raise exception 'Ce statut du compte de gestion n''est pas encore disponible.';
  end if;
  if new.generated_at is not null
     or new.transmitted_at is not null
     or new.approved_at is not null
     or new.difficulty_reported_at is not null then
    raise exception 'Les jalons documentaires ne sont pas encore disponibles.';
  end if;
  if tg_op = 'UPDATE' and (
    new.id <> old.id or new.protected_person_id <> old.protected_person_id
    or new.management_period_id is distinct from old.management_period_id
    or new.period_start <> old.period_start or new.period_end <> old.period_end
    or new.report_year <> old.report_year or new.created_by <> old.created_by
    or new.created_at <> old.created_at
  ) then raise exception 'La période et le rattachement du compte de gestion ne peuvent pas être modifiés.';
  end if;
  if new.management_period_id is not null and not exists (
    select 1 from public.management_periods period
    where period.id = new.management_period_id and period.protected_person_id = new.protected_person_id
      and period.start_date = new.period_start and period.end_date = new.period_end
  ) then raise exception 'L''exercice ne correspond pas à la période du compte de gestion.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger management_reports_protect_identity before insert or update on public.management_reports
for each row execute function public.protect_management_report_identity();

alter table public.management_reports enable row level security;
create policy "management_reports_select_accessible" on public.management_reports for select to authenticated
using (public.can_read_protected_person(protected_person_id));
create policy "management_reports_insert_manage" on public.management_reports for insert to authenticated
with check (created_by = auth.uid() and public.can_manage_protected_person(protected_person_id));
create policy "management_reports_update_manage" on public.management_reports for update to authenticated
using (public.can_manage_protected_person(protected_person_id))
with check (public.can_manage_protected_person(protected_person_id));

grant select, insert, update on public.management_reports to authenticated;
revoke all on function public.protect_management_report_identity() from public;
