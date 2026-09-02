-- Retirer un collaborateur via une opération owner-only, précisément bornée au
-- dossier et à la ligne d'accès ciblés.
create or replace function public.remove_protected_person_access(
  p_protected_person_id uuid,
  p_access_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  access_row public.protected_person_access%rowtype;
  owner_user_id uuid;
  deleted_count integer;
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  if not public.is_application_user_active() then raise exception 'Compte utilisateur inactif.'; end if;

  select * into access_row
  from public.protected_person_access
  where id = p_access_id
    and protected_person_id = p_protected_person_id
  for update;

  if not found then raise exception 'Accès collaborateur introuvable.'; end if;

  select owner_id into owner_user_id
  from public.protected_persons
  where id = access_row.protected_person_id;

  if not found or owner_user_id <> auth.uid() then raise exception 'Accès propriétaire requis.'; end if;
  if access_row.user_id = owner_user_id then raise exception 'Le propriétaire ne peut pas être retiré.'; end if;

  delete from public.protected_person_access
  where id = access_row.id
    and protected_person_id = access_row.protected_person_id;

  get diagnostics deleted_count = row_count;
  if deleted_count <> 1 then raise exception 'Impossible de retirer cet accès.'; end if;
end;
$$;

-- L'émission reste ouverte au propriétaire pour les deux rôles. Un manager ne
-- peut parrainer qu'un accès en lecture seule.
create or replace function public.issue_protected_person_invitation(
  p_protected_person_id uuid,
  p_email text,
  p_role text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(p_email));
  invitation_id uuid;
  caller_is_owner boolean;
  manager_access_id uuid;
  active_invitation public.protected_person_invitations%rowtype;
  active_invitation_found boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  if not public.is_application_user_active() then raise exception 'Compte utilisateur inactif.'; end if;

  select exists (
    select 1 from public.protected_persons
    where id = p_protected_person_id and owner_id = auth.uid()
  ) into caller_is_owner;

  if p_role not in ('manager', 'read_only') then raise exception 'Rôle invalide.'; end if;
  if normalized_email is null
     or normalized_email = ''
     or length(normalized_email) > 320
     or normalized_email ~ '[[:space:]]'
     or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+$' then
    raise exception 'Adresse email invalide.';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Jeton invalide.'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '8 days' then raise exception 'Expiration invalide.'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_protected_person_id::text || ':' || normalized_email, 0)
  );

  select * into active_invitation
  from public.protected_person_invitations
  where protected_person_id = p_protected_person_id
    and lower(trim(email)) = normalized_email
    and accepted_at is null
    and revoked_at is null
  for update;
  active_invitation_found := found;

  if not caller_is_owner then
    select id into manager_access_id
    from public.protected_person_access
    where protected_person_id = p_protected_person_id
      and user_id = auth.uid()
      and role = 'manager'
    for update;

    if not found then raise exception 'Dossier introuvable.'; end if;
    if p_role <> 'read_only' then raise exception 'Un gestionnaire ne peut inviter qu''en lecture seule.'; end if;
    if active_invitation_found
       and (active_invitation.role <> 'read_only' or active_invitation.invited_by <> auth.uid()) then
      raise exception 'Cette invitation est gérée par un autre responsable du dossier.';
    end if;
  end if;

  update public.protected_person_invitations
  set revoked_at = now()
  where protected_person_id = p_protected_person_id
    and lower(trim(email)) = normalized_email
    and accepted_at is null
    and revoked_at is null;

  insert into public.protected_person_invitations (
    protected_person_id, email, role, token_hash, expires_at, invited_by
  ) values (
    p_protected_person_id, normalized_email, p_role, p_token_hash, p_expires_at, auth.uid()
  ) returning id into invitation_id;

  return invitation_id;
end;
$$;

create or replace function public.reissue_protected_person_invitation(
  p_invitation_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_protected_person_id uuid;
  source_normalized_email text;
  source_invitation public.protected_person_invitations%rowtype;
  invitation_id uuid;
  caller_is_owner boolean;
  manager_access_id uuid;
  invitation_found boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  if not public.is_application_user_active() then raise exception 'Compte utilisateur inactif.'; end if;

  select protected_person_id, lower(trim(email))
  into source_protected_person_id, source_normalized_email
  from public.protected_person_invitations
  where id = p_invitation_id;

  if not found then raise exception 'Invitation indisponible.'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(source_protected_person_id::text || ':' || source_normalized_email, 0)
  );

  select * into source_invitation
  from public.protected_person_invitations
  where id = p_invitation_id
  for update;
  invitation_found := found;

  select exists (
    select 1 from public.protected_persons
    where id = source_protected_person_id and owner_id = auth.uid()
  ) into caller_is_owner;

  if not invitation_found
     or source_invitation.protected_person_id <> source_protected_person_id
     or lower(trim(source_invitation.email)) <> source_normalized_email
     or source_invitation.accepted_at is not null
     or source_invitation.revoked_at is not null then
    raise exception 'Invitation indisponible.';
  end if;

  if not caller_is_owner then
    select id into manager_access_id
    from public.protected_person_access
    where protected_person_id = source_protected_person_id
      and user_id = auth.uid()
      and role = 'manager'
    for update;

    if not found
       or source_invitation.role <> 'read_only'
       or source_invitation.invited_by <> auth.uid() then
      raise exception 'Invitation indisponible.';
    end if;
  end if;

  if source_normalized_email is null
     or source_normalized_email = ''
     or length(source_normalized_email) > 320
     or source_normalized_email ~ '[[:space:]]'
     or source_normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+$' then
    raise exception 'Adresse email invalide.';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Jeton invalide.'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '8 days' then raise exception 'Expiration invalide.'; end if;

  update public.protected_person_invitations
  set revoked_at = now()
  where protected_person_id = source_invitation.protected_person_id
    and lower(trim(email)) = source_normalized_email
    and accepted_at is null
    and revoked_at is null;

  insert into public.protected_person_invitations (
    protected_person_id, email, role, token_hash, expires_at, invited_by
  ) values (
    source_invitation.protected_person_id,
    source_normalized_email,
    source_invitation.role,
    p_token_hash,
    p_expires_at,
    auth.uid()
  ) returning id into invitation_id;

  return invitation_id;
end;
$$;

create or replace function public.revoke_protected_person_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_protected_person_id uuid;
  invitation_normalized_email text;
  invitation public.protected_person_invitations%rowtype;
  caller_is_owner boolean;
  manager_access_id uuid;
  invitation_found boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  if not public.is_application_user_active() then raise exception 'Compte utilisateur inactif.'; end if;

  select protected_person_id, lower(trim(email))
  into invitation_protected_person_id, invitation_normalized_email
  from public.protected_person_invitations
  where id = p_invitation_id;

  if not found then raise exception 'Invitation indisponible.'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(invitation_protected_person_id::text || ':' || invitation_normalized_email, 0)
  );

  select * into invitation
  from public.protected_person_invitations
  where id = p_invitation_id
  for update;
  invitation_found := found;

  select exists (
    select 1 from public.protected_persons
    where id = invitation_protected_person_id and owner_id = auth.uid()
  ) into caller_is_owner;

  if not invitation_found
     or invitation.protected_person_id <> invitation_protected_person_id
     or lower(trim(invitation.email)) <> invitation_normalized_email
     or invitation.accepted_at is not null
     or invitation.revoked_at is not null then
    raise exception 'Invitation indisponible.';
  end if;

  if not caller_is_owner then
    select id into manager_access_id
    from public.protected_person_access
    where protected_person_id = invitation_protected_person_id
      and user_id = auth.uid()
      and role = 'manager'
    for update;

    if not found
       or invitation.role <> 'read_only'
       or invitation.invited_by <> auth.uid() then
      raise exception 'Invitation indisponible.';
    end if;
  end if;

  update public.protected_person_invitations
  set revoked_at = now()
  where id = invitation.id;
end;
$$;

-- Les suppressions directes ne sont plus nécessaires : le retrait passe par la
-- RPC précisément bornée. Les mises à jour de rôle restent protégées par RLS.
revoke delete on public.protected_person_access from authenticated;

revoke all on function public.remove_protected_person_access(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function public.issue_protected_person_invitation(uuid, text, text, text, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.reissue_protected_person_invitation(uuid, text, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.revoke_protected_person_invitation(uuid) from public, anon, authenticated, service_role;

grant execute on function public.remove_protected_person_access(uuid, uuid) to authenticated;
grant execute on function public.issue_protected_person_invitation(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function public.reissue_protected_person_invitation(uuid, text, timestamptz) to authenticated;
grant execute on function public.revoke_protected_person_invitation(uuid) to authenticated;
