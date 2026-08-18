create type public.management_report_transmission_method as enum (
  'postal_mail',
  'hand_delivery',
  'email',
  'external_platform',
  'other'
);

do $$
begin
  if not exists (
    select 1 from pg_roles
    where rolname = 'patrigest_management_report_transmission_executor'
  ) then
    create role patrigest_management_report_transmission_executor
      nologin noinherit nobypassrls;
  end if;
end;
$$;

alter role patrigest_management_report_transmission_executor
  nologin noinherit nobypassrls;

grant patrigest_management_report_transmission_executor to postgres;

create table public.management_report_transmissions (
  id uuid primary key default gen_random_uuid(),
  management_report_id uuid not null references public.management_reports(id) on delete restrict,
  transmission_date date not null,
  transmission_method public.management_report_transmission_method not null,
  recipient text not null,
  note text,
  declared_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint management_report_transmissions_report_unique unique (management_report_id),
  constraint management_report_transmissions_recipient_required check (
    length(btrim(recipient)) between 1 and 500
  ),
  constraint management_report_transmissions_note_length check (
    note is null or length(note) <= 5000
  ),
  constraint management_report_transmissions_date_not_future check (
    transmission_date <= current_date
  )
);

create or replace function public.protect_management_report_transmission_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id
     or new.management_report_id <> old.management_report_id
     or new.declared_by <> old.declared_by
     or new.created_at <> old.created_at then
    raise exception 'Le rattachement de la transmission ne peut pas être modifié.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger management_report_transmissions_protect_identity
before update on public.management_report_transmissions
for each row execute function public.protect_management_report_transmission_identity();

alter table public.management_report_transmissions enable row level security;

create policy "management_report_transmissions_select_accessible"
on public.management_report_transmissions for select to authenticated
using (exists (
  select 1
  from public.management_reports report
  where report.id = management_report_transmissions.management_report_id
    and public.can_read_protected_person(report.protected_person_id)
));

create policy "management_report_transmissions_executor_insert"
on public.management_report_transmissions for insert
to patrigest_management_report_transmission_executor
with check (true);

create policy "management_report_transmissions_executor_update"
on public.management_report_transmissions for update
to patrigest_management_report_transmission_executor
using (true)
with check (true);

create policy "management_reports_executor_select"
on public.management_reports for select
to patrigest_management_report_transmission_executor
using (true);

create policy "management_reports_executor_update"
on public.management_reports for update
to patrigest_management_report_transmission_executor
using (true)
with check (true);

create policy "management_report_documents_executor_select"
on public.management_report_documents for select
to patrigest_management_report_transmission_executor
using (true);

create policy "management_periods_transmission_executor_select"
on public.management_periods for select
to patrigest_management_report_transmission_executor
using (true);

revoke all on public.management_report_transmissions from public, authenticated;
grant select on public.management_report_transmissions to authenticated;

grant usage on schema public, auth
to patrigest_management_report_transmission_executor;
grant usage on type public.management_report_status,
  public.management_report_document_type,
  public.management_report_transmission_method
to patrigest_management_report_transmission_executor;
grant select on public.management_reports,
  public.management_report_documents,
  public.management_periods,
  public.management_report_transmissions
to patrigest_management_report_transmission_executor;
grant update (status, transmitted_at) on public.management_reports
to patrigest_management_report_transmission_executor;
grant insert (management_report_id, transmission_date, transmission_method,
  recipient, note, declared_by),
  update (transmission_date, transmission_method, recipient, note)
on public.management_report_transmissions
to patrigest_management_report_transmission_executor;
grant execute on function auth.uid(), public.can_manage_protected_person(uuid)
to patrigest_management_report_transmission_executor;

create or replace function public.protect_management_report_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status::text in ('approved', 'difficulty') then
    raise exception 'Ce statut du compte de gestion n''est pas encore disponible.';
  end if;
  if new.approved_at is not null or new.difficulty_reported_at is not null then
    raise exception 'Les jalons documentaires correspondants ne sont pas encore disponibles.';
  end if;
  if tg_op = 'INSERT' and (
    new.status::text = 'transmitted' or new.transmitted_at is not null
  ) then
    raise exception 'La transmission doit utiliser le flux contrôlé.';
  end if;
  if tg_op = 'UPDATE' and old.status::text = 'transmitted' then
    raise exception 'Un compte de gestion transmis est figé.';
  end if;
  if tg_op = 'UPDATE' and old.status::text = 'finalized' and not (
    current_user = 'patrigest_management_report_transmission_executor'
    and new.status::text = 'transmitted'
    and new.transmitted_at is not null
    and new.residence_changed is not distinct from old.residence_changed
    and new.representative_address_changed is not distinct from old.representative_address_changed
    and new.real_estate_confirmed is not distinct from old.real_estate_confirmed
    and new.financial_investments_confirmed is not distinct from old.financial_investments_confirmed
    and new.observations is not distinct from old.observations
    and new.signature_place is not distinct from old.signature_place
    and new.generated_at is not distinct from old.generated_at
    and new.finalized_at is not distinct from old.finalized_at
    and new.approved_at is not distinct from old.approved_at
    and new.difficulty_reported_at is not distinct from old.difficulty_reported_at
  ) then
    raise exception 'Un compte de gestion finalisé est figé.';
  end if;
  if tg_op = 'UPDATE' and old.status::text = 'generated' and (
    new.residence_changed is distinct from old.residence_changed
    or new.representative_address_changed is distinct from old.representative_address_changed
    or new.real_estate_confirmed is distinct from old.real_estate_confirmed
    or new.financial_investments_confirmed is distinct from old.financial_investments_confirmed
    or new.observations is distinct from old.observations
    or new.signature_place is distinct from old.signature_place
  ) then
    raise exception 'Reprenez la préparation avant de modifier le compte de gestion.';
  end if;
  if tg_op = 'UPDATE' and current_user = 'authenticated' and (
    new.generated_at is distinct from old.generated_at
    or new.finalized_at is distinct from old.finalized_at
    or new.transmitted_at is distinct from old.transmitted_at
  ) then
    raise exception 'Les jalons documentaires sont gérés par le flux contrôlé.';
  end if;
  if tg_op = 'UPDATE' and current_user = 'authenticated' and not (
    (old.status::text = 'draft' and new.status::text = 'ready')
    or (old.status::text = 'ready' and new.status::text = 'draft')
    or old.status = new.status
  ) then
    raise exception 'Cette transition doit utiliser le flux documentaire contrôlé.';
  end if;
  if new.status::text = 'generated' then
    if new.generated_at is null or new.finalized_at is not null or new.transmitted_at is not null then
      raise exception 'Les dates du projet généré sont invalides.';
    end if;
  elsif new.status::text = 'finalized' then
    if new.generated_at is null or new.finalized_at is null or new.transmitted_at is not null then
      raise exception 'Les dates de finalisation sont obligatoires.';
    end if;
  elsif new.status::text = 'transmitted' then
    if new.generated_at is null or new.finalized_at is null or new.transmitted_at is null then
      raise exception 'Les dates de transmission sont obligatoires.';
    end if;
  elsif new.generated_at is not null or new.finalized_at is not null or new.transmitted_at is not null then
    raise exception 'Les dates documentaires ne correspondent pas au statut.';
  end if;
  if tg_op = 'UPDATE' and (
    new.id <> old.id or new.protected_person_id <> old.protected_person_id
    or new.management_period_id is distinct from old.management_period_id
    or new.period_start <> old.period_start or new.period_end <> old.period_end
    or new.report_year <> old.report_year or new.created_by <> old.created_by
    or new.created_at <> old.created_at
  ) then
    raise exception 'La période et le rattachement du compte de gestion ne peuvent pas être modifiés.';
  end if;
  if new.management_period_id is not null and not exists (
    select 1 from public.management_periods period
    where period.id = new.management_period_id
      and period.protected_person_id = new.protected_person_id
      and period.start_date = new.period_start
      and period.end_date = new.period_end
  ) then
    raise exception 'L''exercice ne correspond pas à la période du compte de gestion.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.declare_management_report_transmission(
  p_report_id uuid,
  p_transmission_date date,
  p_transmission_method text,
  p_recipient text,
  p_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_report public.management_reports%rowtype;
  v_transmission_id uuid;
  v_recipient text := btrim(p_recipient);
  v_note text := nullif(btrim(p_note), '');
begin
  if (select auth.uid()) is null then
    raise exception 'Authentification requise.';
  end if;

  select * into v_report
  from public.management_reports
  where id = p_report_id
  for update;

  if v_report.id is null
     or not public.can_manage_protected_person(v_report.protected_person_id) then
    raise exception 'Compte de gestion introuvable ou accès refusé.';
  end if;
  if v_report.status::text not in ('finalized', 'transmitted') then
    raise exception 'Le compte de gestion doit être finalisé.';
  end if;
  if not exists (
    select 1 from public.management_report_documents document
    where document.management_report_id = v_report.id
      and document.document_type = 'management_report'
  ) then
    raise exception 'Le document officiel du compte de gestion est introuvable.';
  end if;
  if p_transmission_date is null
     or p_transmission_date > current_date
     or p_transmission_date < v_report.finalized_at::date then
    raise exception 'La date de transmission est invalide.';
  end if;
  if p_transmission_method is null or p_transmission_method not in (
    'postal_mail', 'hand_delivery', 'email', 'external_platform', 'other'
  ) then
    raise exception 'Le mode de transmission est invalide.';
  end if;
  if v_recipient is null or length(v_recipient) = 0 or length(v_recipient) > 500 then
    raise exception 'Le destinataire est obligatoire.';
  end if;
  if v_note is not null and length(v_note) > 5000 then
    raise exception 'La note est trop longue.';
  end if;

  if v_report.status::text = 'finalized' then
    insert into public.management_report_transmissions (
      management_report_id, transmission_date, transmission_method,
      recipient, note, declared_by
    ) values (
      v_report.id, p_transmission_date,
      p_transmission_method::public.management_report_transmission_method,
      v_recipient, v_note, (select auth.uid())
    ) returning id into v_transmission_id;

    update public.management_reports
    set status = 'transmitted', transmitted_at = now()
    where id = v_report.id and status::text = 'finalized';
    if not found then
      raise exception 'Le statut du compte de gestion a changé.';
    end if;
  else
    update public.management_report_transmissions
    set transmission_date = p_transmission_date,
        transmission_method = p_transmission_method::public.management_report_transmission_method,
        recipient = v_recipient,
        note = v_note
    where management_report_id = v_report.id
    returning id into v_transmission_id;
    if not found then
      raise exception 'La déclaration de transmission est introuvable.';
    end if;
  end if;

  return v_transmission_id;
end;
$$;

grant create on schema public
to patrigest_management_report_transmission_executor;
alter function public.declare_management_report_transmission(uuid, date, text, text, text)
owner to patrigest_management_report_transmission_executor;
revoke create on schema public
from patrigest_management_report_transmission_executor;

revoke all on function public.protect_management_report_transmission_identity() from public;
revoke all on function public.declare_management_report_transmission(uuid, date, text, text, text) from public;
grant execute on function public.declare_management_report_transmission(uuid, date, text, text, text) to authenticated;
