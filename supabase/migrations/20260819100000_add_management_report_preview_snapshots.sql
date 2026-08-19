alter table public.management_report_documents
add column preview_snapshot jsonb,
add column snapshot_schema_version integer,
add constraint management_report_documents_snapshot_version_positive check (
  snapshot_schema_version is null or snapshot_schema_version > 0
),
add constraint management_report_documents_snapshot_pair check (
  (preview_snapshot is null and snapshot_schema_version is null)
  or (preview_snapshot is not null and snapshot_schema_version is not null)
);

revoke all on function public.finalize_management_report_draft_generation(uuid, text, text, text, bigint) from public;
revoke all on function public.finalize_management_report_draft_generation(uuid, text, text, text, bigint) from authenticated;
drop function public.finalize_management_report_draft_generation(uuid, text, text, text, bigint);

create function public.finalize_management_report_draft_generation(
  p_report_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_file_size bigint,
  p_preview_snapshot jsonb,
  p_snapshot_schema_version integer
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
  if p_preview_snapshot is null or jsonb_typeof(p_preview_snapshot) <> 'object'
     or p_snapshot_schema_version is null or p_snapshot_schema_version <= 0 then
    raise exception 'Snapshot réglementaire invalide.';
  end if;
  if p_preview_snapshot #>> '{report,id}' is distinct from v_report.id::text
     or p_preview_snapshot #>> '{report,protected_person_id}' is distinct from v_report.protected_person_id::text
     or p_preview_snapshot #>> '{person,id}' is distinct from v_report.protected_person_id::text
     or p_preview_snapshot #>> '{report,report_year}' is distinct from v_report.report_year::text
     or p_preview_snapshot #>> '{report,period_start}' is distinct from v_report.period_start::text
     or p_preview_snapshot #>> '{report,period_end}' is distinct from v_report.period_end::text
     or p_preview_snapshot #>> '{report,status}' is distinct from 'generated' then
    raise exception 'Le snapshot ne correspond pas au compte de gestion.';
  end if;
  if not exists (select 1 from storage.objects object where object.bucket_id = 'management-reports' and object.name = p_storage_path) then
    raise exception 'Le PDF projet est introuvable dans le stockage privé.';
  end if;
  insert into public.management_report_documents (
    management_report_id, document_type, storage_path, file_name, mime_type,
    file_size, preview_snapshot, snapshot_schema_version, generated_by
  ) values (
    v_report.id, 'management_report_draft', p_storage_path, p_file_name, p_mime_type,
    p_file_size, p_preview_snapshot, p_snapshot_schema_version, (select auth.uid())
  ) returning id into v_document_id;
  update public.management_reports
  set status = 'generated', generated_at = now(), finalized_at = null
  where id = v_report.id and status::text = 'ready';
  if not found then raise exception 'Le statut du compte de gestion a changé.'; end if;
  return v_document_id;
end;
$$;

revoke all on function public.finalize_management_report(uuid, text, text, text, bigint) from public;
revoke all on function public.finalize_management_report(uuid, text, text, text, bigint) from authenticated;
drop function public.finalize_management_report(uuid, text, text, text, bigint);

create function public.finalize_management_report(
  p_report_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_file_size bigint,
  p_preview_snapshot jsonb,
  p_snapshot_schema_version integer
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
  if p_preview_snapshot is null or jsonb_typeof(p_preview_snapshot) <> 'object'
     or p_snapshot_schema_version is null or p_snapshot_schema_version <= 0 then
    raise exception 'Snapshot réglementaire invalide.';
  end if;
  if p_preview_snapshot #>> '{report,id}' is distinct from v_report.id::text
     or p_preview_snapshot #>> '{report,protected_person_id}' is distinct from v_report.protected_person_id::text
     or p_preview_snapshot #>> '{person,id}' is distinct from v_report.protected_person_id::text
     or p_preview_snapshot #>> '{report,report_year}' is distinct from v_report.report_year::text
     or p_preview_snapshot #>> '{report,period_start}' is distinct from v_report.period_start::text
     or p_preview_snapshot #>> '{report,period_end}' is distinct from v_report.period_end::text
     or p_preview_snapshot #>> '{report,status}' is distinct from 'finalized' then
    raise exception 'Le snapshot ne correspond pas au compte de gestion.';
  end if;
  if not exists (select 1 from storage.objects object where object.bucket_id = 'management-reports' and object.name = p_storage_path) then
    raise exception 'Le PDF final est introuvable dans le stockage privé.';
  end if;
  if exists (select 1 from storage.objects object where object.bucket_id = 'management-reports' and object.name = v_draft_path) then
    raise exception 'Le PDF projet doit être supprimé du stockage avant la finalisation.';
  end if;
  insert into public.management_report_documents (
    management_report_id, document_type, storage_path, file_name, mime_type,
    file_size, preview_snapshot, snapshot_schema_version, generated_by
  ) values (
    v_report.id, 'management_report', p_storage_path, p_file_name, p_mime_type,
    p_file_size, p_preview_snapshot, p_snapshot_schema_version, (select auth.uid())
  ) returning id into v_document_id;
  delete from public.management_report_documents
  where management_report_id = v_report.id
    and document_type = 'management_report_draft'
    and storage_path = v_draft_path;
  if not found then raise exception 'Le document projet est introuvable.'; end if;
  execute 'update public.management_reports set status = ''finalized'', finalized_at = now() where id = $1 and status::text = ''generated''' using v_report.id;
  get diagnostics v_row_count = row_count;
  if v_row_count <> 1 then raise exception 'Le statut du compte de gestion a changé.'; end if;
  return v_document_id;
end;
$$;

revoke all on function public.finalize_management_report_draft_generation(uuid, text, text, text, bigint, jsonb, integer) from public;
revoke all on function public.finalize_management_report(uuid, text, text, text, bigint, jsonb, integer) from public;
grant execute on function public.finalize_management_report_draft_generation(uuid, text, text, text, bigint, jsonb, integer) to authenticated;
grant execute on function public.finalize_management_report(uuid, text, text, text, bigint, jsonb, integer) to authenticated;
