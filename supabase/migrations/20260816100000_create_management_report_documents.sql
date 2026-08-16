alter type public.management_report_status add value if not exists 'finalized' after 'generated';

alter table public.management_reports
add column finalized_at timestamptz;

create type public.management_report_document_type as enum (
  'management_report_draft',
  'management_report',
  'approval_certificate',
  'difficulty_report'
);

create table public.management_report_documents (
  id uuid primary key default gen_random_uuid(),
  management_report_id uuid not null references public.management_reports(id) on delete restrict,
  document_type public.management_report_document_type not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type = 'application/pdf'),
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  generated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (management_report_id, document_type)
);

create index management_report_documents_report_idx
on public.management_report_documents(management_report_id, document_type);

create or replace function public.reject_management_report_document_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Un document de compte de gestion ne peut pas être modifié.';
end;
$$;

create trigger management_report_documents_reject_update
before update on public.management_report_documents
for each row execute function public.reject_management_report_document_update();

alter table public.management_report_documents enable row level security;

create policy "management_report_documents_select_accessible"
on public.management_report_documents for select to authenticated
using (exists (
  select 1 from public.management_reports report
  where report.id = management_report_documents.management_report_id
    and public.can_read_protected_person(report.protected_person_id)
));

grant select on public.management_report_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('management-reports', 'management-reports', false, 20971520, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "management_reports_storage_select_accessible"
on storage.objects for select to authenticated
using (
  bucket_id = 'management-reports'
  and name ~ '^protected-persons/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/management-reports/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/management-report(-draft)?\.pdf$'
  and array_length(storage.foldername(name), 1) = 4
  and exists (
    select 1
    from public.management_report_documents document
    join public.management_reports report on report.id = document.management_report_id
    where document.storage_path = name
      and report.id = ((storage.foldername(name))[4])::uuid
      and report.protected_person_id = ((storage.foldername(name))[2])::uuid
      and public.can_read_protected_person(report.protected_person_id)
      and (
        (storage.filename(name) = 'management-report-draft.pdf' and document.document_type = 'management_report_draft')
        or (storage.filename(name) = 'management-report.pdf' and document.document_type = 'management_report')
      )
  )
);

create policy "management_reports_storage_insert_manage"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'management-reports'
  and name ~ '^protected-persons/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/management-reports/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/management-report(-draft)?\.pdf$'
  and array_length(storage.foldername(name), 1) = 4
  and exists (
    select 1 from public.management_reports report
    where report.id = ((storage.foldername(name))[4])::uuid
      and report.protected_person_id = ((storage.foldername(name))[2])::uuid
      and public.can_manage_protected_person(report.protected_person_id)
      and (
        (
          storage.filename(name) = 'management-report-draft.pdf'
          and (
            (report.status = 'ready' and not exists (
              select 1 from public.management_report_documents document
              where document.management_report_id = report.id
                and document.document_type = 'management_report_draft'
            ))
            or (report.status = 'generated' and exists (
              select 1 from public.management_report_documents document
              where document.management_report_id = report.id
                and document.document_type = 'management_report_draft'
                and document.storage_path = name
            ))
          )
        )
        or (
          storage.filename(name) = 'management-report.pdf'
          and report.status = 'generated'
          and exists (
            select 1 from public.management_report_documents document
            where document.management_report_id = report.id
              and document.document_type = 'management_report_draft'
          )
          and not exists (
            select 1 from public.management_report_documents document
            where document.management_report_id = report.id
              and document.document_type = 'management_report'
          )
        )
      )
  )
);

create policy "management_reports_storage_delete_controlled"
on storage.objects for delete to authenticated
using (
  bucket_id = 'management-reports'
  and name ~ '^protected-persons/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/management-reports/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/management-report(-draft)?\.pdf$'
  and array_length(storage.foldername(name), 1) = 4
  and exists (
    select 1 from public.management_reports report
    where report.id = ((storage.foldername(name))[4])::uuid
      and report.protected_person_id = ((storage.foldername(name))[2])::uuid
      and report.status in ('ready', 'generated')
      and public.can_manage_protected_person(report.protected_person_id)
      and (
        storage.filename(name) = 'management-report-draft.pdf'
        or (
          storage.filename(name) = 'management-report.pdf'
          and report.status = 'generated'
          and not exists (
            select 1 from public.management_report_documents document
            where document.management_report_id = report.id
              and document.document_type = 'management_report'
          )
        )
      )
  )
);

create or replace function public.protect_management_report_storage_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.bucket_id = 'management-reports'
     and (new.bucket_id <> old.bucket_id or new.name <> old.name) then
    raise exception 'Le rattachement Storage du compte de gestion ne peut pas être modifié.';
  end if;
  return new;
end;
$$;

create trigger management_reports_protect_storage_identity
before update on storage.objects for each row
when (old.bucket_id = 'management-reports')
execute function public.protect_management_report_storage_identity();

create or replace function public.protect_management_report_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status::text in ('transmitted', 'approved', 'difficulty') then
    raise exception 'Ce statut du compte de gestion n''est pas encore disponible.';
  end if;
  if new.transmitted_at is not null or new.approved_at is not null
     or new.difficulty_reported_at is not null then
    raise exception 'Les jalons documentaires correspondants ne sont pas encore disponibles.';
  end if;
  if tg_op = 'UPDATE' and old.status::text = 'finalized' then
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
  ) then
    raise exception 'Les jalons de génération sont gérés par le flux documentaire contrôlé.';
  end if;
  if tg_op = 'UPDATE' and current_user = 'authenticated' and not (
    (old.status::text = 'draft' and new.status::text = 'ready')
    or (old.status::text = 'ready' and new.status::text = 'draft')
    or old.status = new.status
  ) then
    raise exception 'Cette transition doit utiliser le flux documentaire contrôlé.';
  end if;
  if new.status::text = 'generated' then
    if new.generated_at is null or new.finalized_at is not null then
      raise exception 'Les dates du projet généré sont invalides.';
    end if;
  elsif new.status::text = 'finalized' then
    if new.generated_at is null or new.finalized_at is null then
      raise exception 'Les dates de finalisation sont obligatoires.';
    end if;
  elsif new.generated_at is not null or new.finalized_at is not null then
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

create or replace function public.finalize_management_report_draft_generation(
  p_report_id uuid, p_storage_path text, p_file_name text,
  p_mime_type text, p_file_size bigint
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_report public.management_reports%rowtype;
  v_document_id uuid;
  v_expected_path text;
begin
  if (select auth.uid()) is null then raise exception 'Authentification requise.'; end if;
  select * into v_report from public.management_reports where id = p_report_id for update;
  if v_report.id is null or not public.can_manage_protected_person(v_report.protected_person_id) then
    raise exception 'Compte de gestion introuvable ou accès refusé.';
  end if;
  if v_report.status::text <> 'ready' then raise exception 'Le compte de gestion doit être prêt.'; end if;
  v_expected_path := 'protected-persons/' || v_report.protected_person_id::text || '/management-reports/' || v_report.id::text || '/management-report-draft.pdf';
  if p_storage_path <> v_expected_path or p_mime_type <> 'application/pdf' or p_file_size <= 0 or p_file_size > 20971520 then
    raise exception 'Métadonnées du document invalides.';
  end if;
  if not exists (select 1 from storage.objects object where object.bucket_id = 'management-reports' and object.name = p_storage_path) then
    raise exception 'Le PDF projet est introuvable dans le stockage privé.';
  end if;
  insert into public.management_report_documents (management_report_id, document_type, storage_path, file_name, mime_type, file_size, generated_by)
  values (v_report.id, 'management_report_draft', p_storage_path, p_file_name, p_mime_type, p_file_size, (select auth.uid()))
  returning id into v_document_id;
  update public.management_reports set status = 'generated', generated_at = now(), finalized_at = null where id = v_report.id and status::text = 'ready';
  if not found then raise exception 'Le statut du compte de gestion a changé.'; end if;
  return v_document_id;
end;
$$;

create or replace function public.resume_management_report_preparation(p_report_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_report public.management_reports%rowtype;
  v_expected_path text;
begin
  if (select auth.uid()) is null then raise exception 'Authentification requise.'; end if;
  select * into v_report from public.management_reports where id = p_report_id for update;
  if v_report.id is null or not public.can_manage_protected_person(v_report.protected_person_id) then
    raise exception 'Compte de gestion introuvable ou accès refusé.';
  end if;
  if v_report.status::text <> 'generated' then raise exception 'Seul un projet généré peut être repris.'; end if;
  v_expected_path := 'protected-persons/' || v_report.protected_person_id::text || '/management-reports/' || v_report.id::text || '/management-report-draft.pdf';
  if exists (select 1 from storage.objects object where object.bucket_id = 'management-reports' and object.name = v_expected_path) then
    raise exception 'Le PDF projet doit être supprimé du stockage avant la reprise.';
  end if;
  delete from public.management_report_documents
  where management_report_id = v_report.id and document_type = 'management_report_draft' and storage_path = v_expected_path;
  if not found then raise exception 'Le document projet est introuvable.'; end if;
  update public.management_reports set status = 'draft', generated_at = null, finalized_at = null where id = v_report.id and status::text = 'generated';
  if not found then raise exception 'Le statut du compte de gestion a changé.'; end if;
end;
$$;

create or replace function public.finalize_management_report(
  p_report_id uuid, p_storage_path text, p_file_name text,
  p_mime_type text, p_file_size bigint
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_report public.management_reports%rowtype;
  v_document_id uuid;
  v_draft_path text;
  v_expected_path text;
  v_row_count bigint;
begin
  if (select auth.uid()) is null then raise exception 'Authentification requise.'; end if;
  select * into v_report from public.management_reports where id = p_report_id for update;
  if v_report.id is null or not public.can_manage_protected_person(v_report.protected_person_id) then
    raise exception 'Compte de gestion introuvable ou accès refusé.';
  end if;
  if v_report.status::text <> 'generated' then raise exception 'Un projet doit être généré avant la finalisation.'; end if;
  v_draft_path := 'protected-persons/' || v_report.protected_person_id::text || '/management-reports/' || v_report.id::text || '/management-report-draft.pdf';
  v_expected_path := 'protected-persons/' || v_report.protected_person_id::text || '/management-reports/' || v_report.id::text || '/management-report.pdf';
  if p_storage_path <> v_expected_path or p_mime_type <> 'application/pdf' or p_file_size <= 0 or p_file_size > 20971520 then
    raise exception 'Métadonnées du document final invalides.';
  end if;
  if not exists (select 1 from storage.objects object where object.bucket_id = 'management-reports' and object.name = p_storage_path) then
    raise exception 'Le PDF final est introuvable dans le stockage privé.';
  end if;
  if exists (select 1 from storage.objects object where object.bucket_id = 'management-reports' and object.name = v_draft_path) then
    raise exception 'Le PDF projet doit être supprimé du stockage avant la finalisation.';
  end if;
  insert into public.management_report_documents (management_report_id, document_type, storage_path, file_name, mime_type, file_size, generated_by)
  values (v_report.id, 'management_report', p_storage_path, p_file_name, p_mime_type, p_file_size, (select auth.uid()))
  returning id into v_document_id;
  delete from public.management_report_documents where management_report_id = v_report.id and document_type = 'management_report_draft' and storage_path = v_draft_path;
  if not found then raise exception 'Le document projet est introuvable.'; end if;
  execute 'update public.management_reports set status = ''finalized'', finalized_at = now() where id = $1 and status::text = ''generated''' using v_report.id;
  get diagnostics v_row_count = row_count;
  if v_row_count <> 1 then raise exception 'Le statut du compte de gestion a changé.'; end if;
  return v_document_id;
end;
$$;

revoke all on function public.reject_management_report_document_update() from public;
revoke all on function public.protect_management_report_storage_identity() from public;
revoke all on function public.finalize_management_report_draft_generation(uuid, text, text, text, bigint) from public;
revoke all on function public.resume_management_report_preparation(uuid) from public;
revoke all on function public.finalize_management_report(uuid, text, text, text, bigint) from public;
grant execute on function public.finalize_management_report_draft_generation(uuid, text, text, text, bigint) to authenticated;
grant execute on function public.resume_management_report_preparation(uuid) to authenticated;
grant execute on function public.finalize_management_report(uuid, text, text, text, bigint) to authenticated;
