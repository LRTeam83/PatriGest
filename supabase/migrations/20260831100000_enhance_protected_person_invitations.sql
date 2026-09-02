alter table public.protected_person_invitations
add column revoked_at timestamptz;

alter table public.protected_person_invitations
add constraint protected_person_invitations_not_accepted_and_revoked
check (accepted_at is null or revoked_at is null);

-- Conserver l'invitation active la plus récente pour chaque dossier/adresse
-- normalisée et révoquer les éventuels doublons historiques sans les supprimer.
with ranked_active_invitations as (
  select
    id,
    row_number() over (
      partition by protected_person_id, lower(trim(email))
      order by created_at desc, id desc
    ) as active_rank
  from public.protected_person_invitations
  where accepted_at is null
    and revoked_at is null
)
update public.protected_person_invitations as invitations
set revoked_at = now()
from ranked_active_invitations as ranked
where invitations.id = ranked.id
  and ranked.active_rank > 1;

drop index public.protected_person_invitations_pending_email_idx;

-- PostgreSQL n'autorise pas now() dans le prédicat immuable d'un index partiel.
-- Les RPC ci-dessous révoquent donc explicitement toute invitation non acceptée
-- avant d'en créer une nouvelle, y compris lorsqu'elle est expirée.
create unique index protected_person_invitations_active_email_idx
on public.protected_person_invitations (protected_person_id, lower(trim(email)))
where accepted_at is null and revoked_at is null;

drop policy "protected_person_invitations_owner_select"
on public.protected_person_invitations;
drop policy "protected_person_invitations_owner_insert"
on public.protected_person_invitations;
drop policy "protected_person_invitations_owner_update"
on public.protected_person_invitations;
drop policy "protected_person_invitations_owner_delete"
on public.protected_person_invitations;

create policy "protected_person_invitations_manage_select"
on public.protected_person_invitations
for select to authenticated
using (public.can_manage_protected_person(protected_person_id));

revoke select, insert, delete on public.protected_person_invitations from authenticated;
revoke update (role, expires_at) on public.protected_person_invitations from authenticated;
grant select (
  id,
  protected_person_id,
  email,
  role,
  expires_at,
  accepted_at,
  revoked_at,
  invited_by,
  created_at
) on public.protected_person_invitations to authenticated;

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
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  if not public.can_manage_protected_person(p_protected_person_id) then raise exception 'Dossier introuvable.'; end if;
  if normalized_email is null
     or normalized_email = ''
     or length(normalized_email) > 320
     or normalized_email ~ '[[:space:]]'
     or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+$' then
    raise exception 'Adresse email invalide.';
  end if;
  if p_role not in ('manager', 'read_only') then raise exception 'Rôle invalide.'; end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Jeton invalide.'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '8 days' then raise exception 'Expiration invalide.'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_protected_person_id::text || ':' || normalized_email, 0)
  );

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
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;

  select protected_person_id, lower(trim(email))
  into source_protected_person_id, source_normalized_email
  from public.protected_person_invitations
  where id = p_invitation_id;

  if not found then raise exception 'Invitation indisponible.'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      source_protected_person_id::text || ':' || source_normalized_email,
      0
    )
  );

  select * into source_invitation
  from public.protected_person_invitations
  where id = p_invitation_id
  for update;

  if not found
     or source_invitation.protected_person_id <> source_protected_person_id
     or lower(trim(source_invitation.email)) <> source_normalized_email
     or source_invitation.accepted_at is not null
     or source_invitation.revoked_at is not null
     or not public.can_manage_protected_person(source_invitation.protected_person_id) then
    raise exception 'Invitation indisponible.';
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
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;

  select protected_person_id, lower(trim(email))
  into invitation_protected_person_id, invitation_normalized_email
  from public.protected_person_invitations
  where id = p_invitation_id;

  if not found then raise exception 'Invitation indisponible.'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      invitation_protected_person_id::text || ':' || invitation_normalized_email,
      0
    )
  );

  select * into invitation
  from public.protected_person_invitations
  where id = p_invitation_id
  for update;

  if not found
     or invitation.protected_person_id <> invitation_protected_person_id
     or lower(trim(invitation.email)) <> invitation_normalized_email
     or invitation.accepted_at is not null
     or invitation.revoked_at is not null
     or not public.can_manage_protected_person(invitation.protected_person_id) then
    raise exception 'Invitation indisponible.';
  end if;

  update public.protected_person_invitations
  set revoked_at = now()
  where id = invitation.id;
end;
$$;

create or replace function public.accept_protected_person_invitation(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_id uuid;
  invitation_protected_person_id uuid;
  invitation_normalized_email text;
  invitation public.protected_person_invitations%rowtype;
  caller_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;

  select id, protected_person_id, lower(trim(email))
  into invitation_id, invitation_protected_person_id, invitation_normalized_email
  from public.protected_person_invitations
  where token_hash = p_token_hash
    and accepted_at is null
    and revoked_at is null
    and expires_at > now();

  if not found then raise exception 'Invitation invalide ou expirée.'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      invitation_protected_person_id::text || ':' || invitation_normalized_email,
      0
    )
  );

  select * into invitation
  from public.protected_person_invitations
  where id = invitation_id
    and token_hash = p_token_hash
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  for update;

  if not found
     or invitation.protected_person_id <> invitation_protected_person_id
     or lower(trim(invitation.email)) <> invitation_normalized_email
     or invitation_normalized_email <> caller_email then
    raise exception 'Invitation invalide ou expirée.';
  end if;

  insert into public.protected_person_access(protected_person_id, user_id, role, invited_by)
  values (invitation.protected_person_id, auth.uid(), invitation.role, invitation.invited_by)
  on conflict (protected_person_id, user_id) do nothing;

  update public.protected_person_invitations
  set accepted_at = now()
  where id = invitation.id;

  return invitation.protected_person_id;
end;
$$;

revoke all on function public.issue_protected_person_invitation(uuid, text, text, text, timestamptz) from public;
revoke all on function public.reissue_protected_person_invitation(uuid, text, timestamptz) from public;
revoke all on function public.revoke_protected_person_invitation(uuid) from public;

grant execute on function public.issue_protected_person_invitation(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function public.reissue_protected_person_invitation(uuid, text, timestamptz) to authenticated;
grant execute on function public.revoke_protected_person_invitation(uuid) to authenticated;
