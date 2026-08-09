do $$
begin
  if exists (
    select 1
    from public.platform_administrators administrators
    where exists (
      select 1 from public.protected_persons persons
      where persons.owner_id = administrators.user_id
    ) or exists (
      select 1 from public.protected_person_access access
      where access.user_id = administrators.user_id
    )
  ) then
    raise exception 'Un administrateur de plateforme possède déjà un dossier ou un accès collaborateur.';
  end if;

  if exists (
    select 1
    from public.protected_person_invitations invitations
    join auth.users users on lower(users.email) = lower(invitations.email)
    join public.platform_administrators administrators on administrators.user_id = users.id
    where invitations.accepted_at is null
  ) then
    raise exception 'Une invitation métier en attente cible déjà un administrateur de plateforme.';
  end if;
end;
$$;

create or replace function public.prevent_platform_admin_dossier_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.platform_administrators
    where user_id = new.owner_id
  ) then
    raise exception 'Un administrateur de plateforme ne peut pas posséder de dossier.';
  end if;

  return new;
end;
$$;

create trigger protected_persons_reject_platform_admin_owner
before insert or update of owner_id on public.protected_persons
for each row execute function public.prevent_platform_admin_dossier_ownership();

create or replace function public.prevent_platform_admin_collaboration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.platform_administrators
    where user_id = new.user_id
  ) then
    raise exception 'Un administrateur de plateforme ne peut pas devenir collaborateur d''un dossier.';
  end if;

  return new;
end;
$$;

create trigger protected_person_access_reject_platform_admin
before insert or update of user_id on public.protected_person_access
for each row execute function public.prevent_platform_admin_collaboration();

create or replace function public.prevent_platform_admin_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from auth.users users
    join public.platform_administrators administrators on administrators.user_id = users.id
    where lower(users.email) = lower(new.email)
  ) then
    raise exception 'Un administrateur de plateforme ne peut pas recevoir d''invitation métier.';
  end if;

  return new;
end;
$$;

create trigger protected_person_invitations_reject_platform_admin
before insert or update of email on public.protected_person_invitations
for each row execute function public.prevent_platform_admin_invitation();

create or replace function public.prevent_business_user_platform_admin_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.protected_persons
    where owner_id = new.user_id
  ) or exists (
    select 1 from public.protected_person_access
    where user_id = new.user_id
  ) or exists (
    select 1
    from auth.users users
    join public.protected_person_invitations invitations
      on lower(invitations.email) = lower(users.email)
    where users.id = new.user_id
      and invitations.accepted_at is null
  ) then
    raise exception 'Un utilisateur possédant un dossier, un accès ou une invitation métier ne peut pas devenir administrateur de plateforme.';
  end if;

  return new;
end;
$$;

create trigger platform_administrators_reject_business_user
before insert or update of user_id on public.platform_administrators
for each row execute function public.prevent_business_user_platform_admin_role();

revoke all on function public.prevent_platform_admin_dossier_ownership() from public;
revoke all on function public.prevent_platform_admin_collaboration() from public;
revoke all on function public.prevent_platform_admin_invitation() from public;
revoke all on function public.prevent_business_user_platform_admin_role() from public;
