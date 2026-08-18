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
  v_authenticated_user_id uuid;
  v_jwt_claims text;
  v_recipient text := btrim(p_recipient);
  v_note text := nullif(btrim(p_note), '');
begin
  v_jwt_claims := nullif(current_setting('request.jwt.claims', true), '');
  begin
    v_authenticated_user_id := nullif(
      v_jwt_claims::jsonb ->> 'sub',
      ''
    )::uuid;
  exception
    when invalid_text_representation then
      raise exception 'Authentification requise.';
  end;

  if v_authenticated_user_id is null then
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
      v_recipient, v_note, v_authenticated_user_id
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
