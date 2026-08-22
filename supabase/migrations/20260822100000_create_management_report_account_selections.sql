create type public.management_report_account_selection_mode as enum (
  'included_manual',
  'excluded_manual'
);

create table public.management_report_account_selections (
  id uuid primary key default gen_random_uuid(),
  management_report_id uuid not null references public.management_reports(id) on delete restrict,
  financial_account_id uuid not null references public.financial_accounts(id) on delete restrict,
  selection_mode public.management_report_account_selection_mode not null,
  reason text not null check (length(trim(reason)) between 1 and 2000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (management_report_id, financial_account_id)
);

create or replace function public.protect_management_report_account_selection()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_report public.management_reports%rowtype;
  v_account public.financial_accounts%rowtype;
  v_report_id uuid;
begin
  if tg_op = 'DELETE' then
    v_report_id := old.management_report_id;
  else
    v_report_id := new.management_report_id;
  end if;

  select * into v_report
  from public.management_reports
  where id = v_report_id
  for update;

  if not found or v_report.status <> 'draft' then
    raise exception 'La sélection des comptes est modifiable uniquement pendant la préparation.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  select * into v_account
  from public.financial_accounts
  where id = new.financial_account_id;

  if not found or v_account.protected_person_id <> v_report.protected_person_id then
    raise exception 'Le compte et le compte de gestion doivent appartenir au même dossier.';
  end if;

  if tg_op = 'UPDATE' and (
    new.id <> old.id
    or new.management_report_id <> old.management_report_id
    or new.financial_account_id <> old.financial_account_id
    or new.created_by <> old.created_by
    or new.created_at <> old.created_at
  ) then
    raise exception 'Le rattachement de la sélection ne peut pas être modifié.';
  end if;

  new.reason := trim(new.reason);
  new.updated_at := now();
  return new;
end;
$$;

create trigger management_report_account_selections_protect
before insert or update or delete on public.management_report_account_selections
for each row execute function public.protect_management_report_account_selection();

alter table public.management_report_account_selections enable row level security;

create policy "management_report_account_selections_select_accessible"
on public.management_report_account_selections for select to authenticated
using (exists (
  select 1 from public.management_reports report
  where report.id = management_report_account_selections.management_report_id
    and public.can_read_protected_person(report.protected_person_id)
));

create policy "management_report_account_selections_insert_manage"
on public.management_report_account_selections for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.management_reports report
    where report.id = management_report_account_selections.management_report_id
      and report.status = 'draft'
      and public.can_manage_protected_person(report.protected_person_id)
  )
);

create policy "management_report_account_selections_update_manage"
on public.management_report_account_selections for update to authenticated
using (exists (
  select 1 from public.management_reports report
  where report.id = management_report_account_selections.management_report_id
    and report.status = 'draft'
    and public.can_manage_protected_person(report.protected_person_id)
))
with check (exists (
  select 1 from public.management_reports report
  where report.id = management_report_account_selections.management_report_id
    and report.status = 'draft'
    and public.can_manage_protected_person(report.protected_person_id)
));

create policy "management_report_account_selections_delete_manage"
on public.management_report_account_selections for delete to authenticated
using (exists (
  select 1 from public.management_reports report
  where report.id = management_report_account_selections.management_report_id
    and report.status = 'draft'
    and public.can_manage_protected_person(report.protected_person_id)
));

grant select, insert, update, delete on public.management_report_account_selections to authenticated;
revoke all on function public.protect_management_report_account_selection() from public;
