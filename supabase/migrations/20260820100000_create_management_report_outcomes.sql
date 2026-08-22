create table public.management_report_approvals (
  id uuid primary key default gen_random_uuid(),
  management_report_id uuid not null references public.management_reports(id) on delete restrict,
  approval_date date not null,
  reviewer_name text not null,
  reviewer_role text,
  note text,
  declared_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint management_report_approvals_report_unique unique (management_report_id),
  constraint management_report_approvals_reviewer_required check (length(btrim(reviewer_name)) between 1 and 500),
  constraint management_report_approvals_reviewer_role_length check (reviewer_role is null or length(reviewer_role) <= 500),
  constraint management_report_approvals_note_length check (note is null or length(note) <= 5000),
  constraint management_report_approvals_date_not_future check (approval_date <= current_date)
);

create table public.management_report_difficulties (
  id uuid primary key default gen_random_uuid(),
  management_report_id uuid not null references public.management_reports(id) on delete restrict,
  difficulty_date date not null,
  recipient text,
  reason text not null,
  note text,
  declared_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint management_report_difficulties_report_unique unique (management_report_id),
  constraint management_report_difficulties_recipient_length check (recipient is null or length(recipient) <= 500),
  constraint management_report_difficulties_reason_required check (length(btrim(reason)) between 1 and 5000),
  constraint management_report_difficulties_note_length check (note is null or length(note) <= 5000),
  constraint management_report_difficulties_date_not_future check (difficulty_date <= current_date)
);

create or replace function public.protect_management_report_outcome_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id
     or new.management_report_id <> old.management_report_id
     or new.declared_by <> old.declared_by
     or new.created_at <> old.created_at then
    raise exception 'Le rattachement du retour ne peut pas être modifié.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger management_report_approvals_protect_identity
before update on public.management_report_approvals
for each row execute function public.protect_management_report_outcome_identity();

create trigger management_report_difficulties_protect_identity
before update on public.management_report_difficulties
for each row execute function public.protect_management_report_outcome_identity();

alter table public.management_report_approvals enable row level security;
alter table public.management_report_difficulties enable row level security;

create policy "management_report_approvals_select_accessible"
on public.management_report_approvals for select to authenticated
using (exists (
  select 1 from public.management_reports report
  where report.id = management_report_approvals.management_report_id
    and public.can_read_protected_person(report.protected_person_id)
));

create policy "management_report_difficulties_select_accessible"
on public.management_report_difficulties for select to authenticated
using (exists (
  select 1 from public.management_reports report
  where report.id = management_report_difficulties.management_report_id
    and public.can_read_protected_person(report.protected_person_id)
));

create policy "management_report_approvals_executor_select"
on public.management_report_approvals for select
to patrigest_management_report_transmission_executor using (true);

create policy "management_report_approvals_executor_insert"
on public.management_report_approvals for insert
to patrigest_management_report_transmission_executor with check (true);

create policy "management_report_approvals_executor_update"
on public.management_report_approvals for update
to patrigest_management_report_transmission_executor using (true) with check (true);

create policy "management_report_difficulties_executor_select"
on public.management_report_difficulties for select
to patrigest_management_report_transmission_executor using (true);

create policy "management_report_difficulties_executor_insert"
on public.management_report_difficulties for insert
to patrigest_management_report_transmission_executor with check (true);

create policy "management_report_difficulties_executor_update"
on public.management_report_difficulties for update
to patrigest_management_report_transmission_executor using (true) with check (true);

revoke all on public.management_report_approvals,
  public.management_report_difficulties from public, authenticated;
grant select on public.management_report_approvals,
  public.management_report_difficulties to authenticated;

grant select on public.management_report_approvals,
  public.management_report_difficulties
to patrigest_management_report_transmission_executor;
grant insert (management_report_id, approval_date, reviewer_name, reviewer_role, note, declared_by),
  update (approval_date, reviewer_name, reviewer_role, note)
on public.management_report_approvals
to patrigest_management_report_transmission_executor;
grant insert (management_report_id, difficulty_date, recipient, reason, note, declared_by),
  update (difficulty_date, recipient, reason, note)
on public.management_report_difficulties
to patrigest_management_report_transmission_executor;
grant update (status, approved_at, difficulty_reported_at)
on public.management_reports
to patrigest_management_report_transmission_executor;

create or replace function public.protect_management_report_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' and (
    new.status::text in ('transmitted', 'approved', 'difficulty')
    or new.transmitted_at is not null or new.approved_at is not null
    or new.difficulty_reported_at is not null
  ) then
    raise exception 'Ce statut doit utiliser le flux contrôlé.';
  end if;
  if tg_op = 'UPDATE' and old.status::text in ('approved', 'difficulty') then
    raise exception 'Ce compte de gestion est définitivement figé.';
  end if;
  if tg_op = 'UPDATE' and old.status::text = 'transmitted' and not (
    current_user = 'patrigest_management_report_transmission_executor'
    and (
      (new.status::text = 'approved' and new.approved_at is not null
       and new.difficulty_reported_at is not distinct from old.difficulty_reported_at)
      or
      (new.status::text = 'difficulty' and new.difficulty_reported_at is not null
       and new.approved_at is not distinct from old.approved_at)
    )
    and new.residence_changed is not distinct from old.residence_changed
    and new.representative_address_changed is not distinct from old.representative_address_changed
    and new.real_estate_confirmed is not distinct from old.real_estate_confirmed
    and new.financial_investments_confirmed is not distinct from old.financial_investments_confirmed
    and new.observations is not distinct from old.observations
    and new.signature_place is not distinct from old.signature_place
    and new.generated_at is not distinct from old.generated_at
    and new.finalized_at is not distinct from old.finalized_at
    and new.transmitted_at is not distinct from old.transmitted_at
  ) then
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
    or new.approved_at is distinct from old.approved_at
    or new.difficulty_reported_at is distinct from old.difficulty_reported_at
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
    if new.generated_at is null or new.finalized_at is not null or new.transmitted_at is not null
       or new.approved_at is not null or new.difficulty_reported_at is not null then
      raise exception 'Les dates du projet généré sont invalides.';
    end if;
  elsif new.status::text = 'finalized' then
    if new.generated_at is null or new.finalized_at is null or new.transmitted_at is not null
       or new.approved_at is not null or new.difficulty_reported_at is not null then
      raise exception 'Les dates de finalisation sont invalides.';
    end if;
  elsif new.status::text = 'transmitted' then
    if new.generated_at is null or new.finalized_at is null or new.transmitted_at is null
       or new.approved_at is not null or new.difficulty_reported_at is not null then
      raise exception 'Les dates de transmission sont invalides.';
    end if;
  elsif new.status::text = 'approved' then
    if new.generated_at is null or new.finalized_at is null or new.transmitted_at is null
       or new.approved_at is null or new.difficulty_reported_at is not null then
      raise exception 'Les dates d''approbation sont invalides.';
    end if;
  elsif new.status::text = 'difficulty' then
    if new.generated_at is null or new.finalized_at is null or new.transmitted_at is null
       or new.difficulty_reported_at is null or new.approved_at is not null then
      raise exception 'Les dates du signalement sont invalides.';
    end if;
  elsif new.generated_at is not null or new.finalized_at is not null
     or new.transmitted_at is not null or new.approved_at is not null
     or new.difficulty_reported_at is not null then
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

create function public.declare_management_report_approval(
  p_report_id uuid, p_approval_date date, p_reviewer_name text,
  p_reviewer_role text default null, p_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_report public.management_reports%rowtype;
  v_transmission public.management_report_transmissions%rowtype;
  v_outcome_id uuid;
  v_user_id uuid;
  v_claims text;
  v_reviewer_name text := btrim(p_reviewer_name);
  v_reviewer_role text := nullif(btrim(p_reviewer_role), '');
  v_note text := nullif(btrim(p_note), '');
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '');
  begin
    v_user_id := nullif(v_claims::jsonb ->> 'sub', '')::uuid;
  exception when invalid_text_representation or invalid_json_text then
    raise exception 'Authentification requise.';
  end;
  if v_user_id is null then raise exception 'Authentification requise.'; end if;
  select * into v_report from public.management_reports where id = p_report_id for update;
  if v_report.id is null or not public.can_manage_protected_person(v_report.protected_person_id) then
    raise exception 'Compte de gestion introuvable ou accès refusé.';
  end if;
  if v_report.status::text not in ('transmitted', 'approved') then
    raise exception 'Seul un compte de gestion transmis peut être déclaré approuvé.';
  end if;
  if not exists (select 1 from public.management_report_documents document
    where document.management_report_id = v_report.id and document.document_type = 'management_report') then
    raise exception 'Le document officiel du compte de gestion est introuvable.';
  end if;
  select * into v_transmission from public.management_report_transmissions
  where management_report_id = v_report.id;
  if v_transmission.id is null then raise exception 'La transmission est introuvable.'; end if;
  if p_approval_date is null or p_approval_date < v_transmission.transmission_date
     or p_approval_date > current_date then raise exception 'La date d''approbation est invalide.'; end if;
  if v_reviewer_name is null or length(v_reviewer_name) = 0 or length(v_reviewer_name) > 500 then
    raise exception 'Le contrôleur ou organisme est obligatoire.';
  end if;
  if v_reviewer_role is not null and length(v_reviewer_role) > 500 then raise exception 'La qualité est trop longue.'; end if;
  if v_note is not null and length(v_note) > 5000 then raise exception 'La note est trop longue.'; end if;
  if v_report.status::text = 'transmitted' then
    insert into public.management_report_approvals
      (management_report_id, approval_date, reviewer_name, reviewer_role, note, declared_by)
    values (v_report.id, p_approval_date, v_reviewer_name, v_reviewer_role, v_note, v_user_id)
    returning id into v_outcome_id;
    update public.management_reports set status = 'approved', approved_at = now()
    where id = v_report.id and status::text = 'transmitted';
    if not found then raise exception 'Le statut du compte de gestion a changé.'; end if;
  else
    update public.management_report_approvals
    set approval_date = p_approval_date, reviewer_name = v_reviewer_name,
        reviewer_role = v_reviewer_role, note = v_note
    where management_report_id = v_report.id returning id into v_outcome_id;
    if not found then raise exception 'La déclaration d''approbation est introuvable.'; end if;
  end if;
  return v_outcome_id;
end;
$$;

create function public.declare_management_report_difficulty(
  p_report_id uuid, p_difficulty_date date, p_reason text,
  p_recipient text default null, p_note text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_report public.management_reports%rowtype;
  v_transmission public.management_report_transmissions%rowtype;
  v_outcome_id uuid;
  v_user_id uuid;
  v_claims text;
  v_reason text := btrim(p_reason);
  v_recipient text := nullif(btrim(p_recipient), '');
  v_note text := nullif(btrim(p_note), '');
begin
  v_claims := nullif(current_setting('request.jwt.claims', true), '');
  begin
    v_user_id := nullif(v_claims::jsonb ->> 'sub', '')::uuid;
  exception when invalid_text_representation or invalid_json_text then
    raise exception 'Authentification requise.';
  end;
  if v_user_id is null then raise exception 'Authentification requise.'; end if;
  select * into v_report from public.management_reports where id = p_report_id for update;
  if v_report.id is null or not public.can_manage_protected_person(v_report.protected_person_id) then
    raise exception 'Compte de gestion introuvable ou accès refusé.';
  end if;
  if v_report.status::text not in ('transmitted', 'difficulty') then
    raise exception 'Seul un compte de gestion transmis peut faire l''objet d''un signalement.';
  end if;
  if not exists (select 1 from public.management_report_documents document
    where document.management_report_id = v_report.id and document.document_type = 'management_report') then
    raise exception 'Le document officiel du compte de gestion est introuvable.';
  end if;
  select * into v_transmission from public.management_report_transmissions
  where management_report_id = v_report.id;
  if v_transmission.id is null then raise exception 'La transmission est introuvable.'; end if;
  if p_difficulty_date is null or p_difficulty_date < v_transmission.transmission_date
     or p_difficulty_date > current_date then raise exception 'La date du signalement est invalide.'; end if;
  if v_reason is null or length(v_reason) = 0 or length(v_reason) > 5000 then raise exception 'Le motif est obligatoire.'; end if;
  if v_recipient is not null and length(v_recipient) > 500 then raise exception 'Le destinataire est trop long.'; end if;
  if v_note is not null and length(v_note) > 5000 then raise exception 'La note est trop longue.'; end if;
  if v_report.status::text = 'transmitted' then
    insert into public.management_report_difficulties
      (management_report_id, difficulty_date, recipient, reason, note, declared_by)
    values (v_report.id, p_difficulty_date, v_recipient, v_reason, v_note, v_user_id)
    returning id into v_outcome_id;
    update public.management_reports set status = 'difficulty', difficulty_reported_at = now()
    where id = v_report.id and status::text = 'transmitted';
    if not found then raise exception 'Le statut du compte de gestion a changé.'; end if;
  else
    update public.management_report_difficulties
    set difficulty_date = p_difficulty_date, recipient = v_recipient,
        reason = v_reason, note = v_note
    where management_report_id = v_report.id returning id into v_outcome_id;
    if not found then raise exception 'Le signalement est introuvable.'; end if;
  end if;
  return v_outcome_id;
end;
$$;

grant create on schema public
to patrigest_management_report_transmission_executor;

alter function public.declare_management_report_approval(uuid, date, text, text, text)
owner to patrigest_management_report_transmission_executor;
alter function public.declare_management_report_difficulty(uuid, date, text, text, text)
owner to patrigest_management_report_transmission_executor;

revoke create on schema public
from patrigest_management_report_transmission_executor;

revoke all on function public.protect_management_report_outcome_identity() from public;
revoke all on function public.declare_management_report_approval(uuid, date, text, text, text)
from public, anon, service_role;
revoke all on function public.declare_management_report_difficulty(uuid, date, text, text, text)
from public, anon, service_role;
grant execute on function public.declare_management_report_approval(uuid, date, text, text, text)
to authenticated;
grant execute on function public.declare_management_report_difficulty(uuid, date, text, text, text)
to authenticated;
