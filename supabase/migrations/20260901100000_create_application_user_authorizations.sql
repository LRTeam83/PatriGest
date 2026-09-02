-- Application-level authorization is intentionally separate from profiles:
-- profiles remain user-editable identity data, while this table is server-owned.
create table public.application_user_authorizations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected')),
  status_changed_at timestamptz not null default now(),
  status_changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger application_user_authorizations_set_updated_at
before update on public.application_user_authorizations
for each row execute function public.set_updated_at();

alter table public.application_user_authorizations enable row level security;

create policy "application_user_authorizations_select_own"
on public.application_user_authorizations
for select to authenticated
using (user_id = (select auth.uid()));

create policy "application_user_authorizations_admin_select"
on public.application_user_authorizations
for select to authenticated
using (public.is_platform_admin());

revoke all on public.application_user_authorizations from public, anon, authenticated;
grant select (
  user_id,
  status,
  status_changed_at,
  status_changed_by,
  created_at,
  updated_at
) on public.application_user_authorizations to authenticated;

-- Every account that predates this authorization model keeps its current access.
insert into public.application_user_authorizations (user_id, status)
select id, 'active'
from auth.users
on conflict (user_id) do nothing;

create or replace function public.initialize_application_user_authorization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(trim(coalesce(new.email, '')));
  initial_status text := 'pending';
begin
  -- Preserve the currently deployed account-request flow. Dossier invitations
  -- activate the account later, atomically, when the invitation is accepted.
  if exists (
    select 1
    from public.account_requests request
    where lower(trim(request.email)) = normalized_email
      and request.status = 'approved'
      and request.invitation_used_at is null
      and request.invitation_expires_at > now()
  ) then
    initial_status := 'active';
  end if;

  insert into public.application_user_authorizations (user_id, status)
  values (new.id, initial_status)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_authorization_created
after insert on auth.users
for each row execute function public.initialize_application_user_authorization();

create or replace function public.is_application_user_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.application_user_authorizations user_authorization
      where user_authorization.user_id = auth.uid()
        and user_authorization.status = 'active'
    )
$$;

revoke all on function public.is_application_user_active() from public, anon, service_role;
grant execute on function public.is_application_user_active() to authenticated;

create or replace function public.is_protected_person_owner(person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_application_user_active()
    and exists (
      select 1
      from public.protected_persons
      where id = person_id
        and owner_id = auth.uid()
    )
$$;

create or replace function public.can_read_protected_person(person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_application_user_active()
    and (
      exists (
        select 1
        from public.protected_persons
        where id = person_id
          and owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.protected_person_access
        where protected_person_id = person_id
          and user_id = auth.uid()
      )
    )
$$;

create or replace function public.can_manage_protected_person(person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_application_user_active()
    and (
      exists (
        select 1
        from public.protected_persons
        where id = person_id
          and owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.protected_person_access
        where protected_person_id = person_id
          and user_id = auth.uid()
          and role = 'manager'
      )
    )
$$;

-- The direct owner INSERT policy is the only dossier entry point which does not
-- delegate to can_read/can_manage, so gate it explicitly.
drop policy "protected_persons_insert_own" on public.protected_persons;
create policy "protected_persons_insert_own"
on public.protected_persons
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and public.is_application_user_active()
);

-- The SELECT policy contains a direct owner branch to support INSERT ... RETURNING;
-- keep that behavior while applying the same application-level gate.
drop policy "protected_persons_select_accessible" on public.protected_persons;
create policy "protected_persons_select_accessible"
on public.protected_persons
for select to authenticated
using (
  public.is_application_user_active()
  and (
    owner_id = (select auth.uid())
    or public.can_read_protected_person(id)
  )
);

-- Categories are the other business resource whose policies are based directly
-- on auth.uid() rather than the dossier helpers.
drop policy "categories_select_available" on public.categories;
create policy "categories_select_available"
on public.categories
for select to authenticated
using (
  public.is_application_user_active()
  and (is_system or owner_id = (select auth.uid()))
);

drop policy "categories_insert_own" on public.categories;
create policy "categories_insert_own"
on public.categories
for insert to authenticated
with check (
  public.is_application_user_active()
  and owner_id = (select auth.uid())
  and not is_system
  and not (select public.is_platform_admin())
);

drop policy "categories_update_own" on public.categories;
create policy "categories_update_own"
on public.categories
for update to authenticated
using (
  public.is_application_user_active()
  and owner_id = (select auth.uid())
  and not is_system
  and not (select public.is_platform_admin())
)
with check (
  public.is_application_user_active()
  and owner_id = (select auth.uid())
  and not is_system
  and not (select public.is_platform_admin())
);

-- Existing authenticated invitees may be pending when they accept an invitation.
-- Activation, access creation and invitation consumption stay in one transaction.
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

  update public.application_user_authorizations
  set status = 'active',
      status_changed_at = now(),
      status_changed_by = invitation.invited_by
  where user_id = auth.uid()
    and status = 'pending';

  if not found and not public.is_application_user_active() then
    raise exception 'Autorisation utilisateur indisponible.';
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

revoke all on function public.accept_protected_person_invitation(text) from public, anon, service_role;
grant execute on function public.accept_protected_person_invitation(text) to authenticated;
