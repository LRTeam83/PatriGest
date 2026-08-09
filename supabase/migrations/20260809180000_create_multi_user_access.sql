create table public.account_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null,
  last_name text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  invitation_token_hash text,
  invitation_expires_at timestamptz,
  invitation_used_at timestamptz,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  constraint account_requests_email_not_blank check (length(trim(email)) > 0),
  constraint account_requests_first_name_not_blank check (length(trim(first_name)) > 0),
  constraint account_requests_last_name_not_blank check (length(trim(last_name)) > 0)
);

create unique index account_requests_one_pending_email_idx
  on public.account_requests (lower(email)) where status = 'pending';
create index account_requests_status_created_at_idx on public.account_requests(status, created_at desc);
create unique index account_requests_invitation_token_hash_idx
  on public.account_requests(invitation_token_hash) where invitation_token_hash is not null;

create table public.protected_person_access (
  id uuid primary key default gen_random_uuid(),
  protected_person_id uuid not null references public.protected_persons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('manager', 'read_only')),
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (protected_person_id, user_id)
);

create index protected_person_access_user_id_idx on public.protected_person_access(user_id);
create index protected_person_access_person_id_idx on public.protected_person_access(protected_person_id);
create trigger protected_person_access_set_updated_at
before update on public.protected_person_access
for each row execute function public.set_updated_at();

create table public.protected_person_invitations (
  id uuid primary key default gen_random_uuid(),
  protected_person_id uuid not null references public.protected_persons(id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager', 'read_only')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint protected_person_invitations_email_not_blank check (length(trim(email)) > 0)
);

create unique index protected_person_invitations_pending_email_idx
  on public.protected_person_invitations(protected_person_id, lower(email))
  where accepted_at is null;
create index protected_person_invitations_expires_at_idx on public.protected_person_invitations(expires_at);

create or replace function public.prevent_protected_person_reassignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.protected_person_id is distinct from old.protected_person_id then
    raise exception 'Le rattachement au dossier ne peut pas être modifié.';
  end if;

  return new;
end;
$$;

create trigger protection_measures_prevent_reassignment
before update on public.protection_measures
for each row execute function public.prevent_protected_person_reassignment();

create trigger management_periods_prevent_reassignment
before update on public.management_periods
for each row execute function public.prevent_protected_person_reassignment();

create trigger financial_accounts_prevent_reassignment
before update on public.financial_accounts
for each row execute function public.prevent_protected_person_reassignment();

create or replace function public.prevent_account_valuation_reassignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.financial_account_id is distinct from old.financial_account_id then
    raise exception 'Le rattachement de la valorisation au compte ne peut pas être modifié.';
  end if;

  return new;
end;
$$;

create trigger account_valuations_prevent_reassignment
before update on public.account_valuations
for each row execute function public.prevent_account_valuation_reassignment();

create or replace function public.protect_protected_person_access_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.protected_person_id is distinct from old.protected_person_id
     or new.user_id is distinct from old.user_id
     or new.invited_by is distinct from old.invited_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Le rattachement et l''origine de cet accès ne peuvent pas être modifiés.';
  end if;

  return new;
end;
$$;

create trigger protected_person_access_protect_identity
before update on public.protected_person_access
for each row execute function public.protect_protected_person_access_identity();

create or replace function public.protect_protected_person_invitation_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.protected_person_id is distinct from old.protected_person_id
     or new.email is distinct from old.email
     or new.token_hash is distinct from old.token_hash
     or new.invited_by is distinct from old.invited_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Le rattachement et l''identité de cette invitation ne peuvent pas être modifiés.';
  end if;

  return new;
end;
$$;

create trigger protected_person_invitations_protect_identity
before update on public.protected_person_invitations
for each row execute function public.protect_protected_person_invitation_identity();

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.platform_administrators where user_id = auth.uid()) $$;

create or replace function public.is_protected_person_owner(person_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.protected_persons where id = person_id and owner_id = auth.uid()) $$;

create or replace function public.can_read_protected_person(person_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_protected_person_owner(person_id) or exists (
    select 1 from public.protected_person_access
    where protected_person_id = person_id and user_id = auth.uid()
  )
$$;

create or replace function public.can_manage_protected_person(person_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_protected_person_owner(person_id) or exists (
    select 1 from public.protected_person_access
    where protected_person_id = person_id and user_id = auth.uid() and role = 'manager'
  )
$$;

create or replace function public.prevent_owner_access_duplication()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_protected_person_owner(new.protected_person_id) and new.user_id = auth.uid()
     or exists (select 1 from public.protected_persons where id = new.protected_person_id and owner_id = new.user_id) then
    raise exception 'Le propriétaire ne peut pas être ajouté comme collaborateur.';
  end if;
  return new;
end;
$$;

create trigger protected_person_access_prevent_owner
before insert or update on public.protected_person_access
for each row execute function public.prevent_owner_access_duplication();

create or replace function public.prevent_protected_person_owner_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.owner_id <> old.owner_id then raise exception 'Le propriétaire du dossier ne peut pas être modifié.'; end if;
  if (new.status, new.archived_at) is distinct from (old.status, old.archived_at)
     and not public.is_protected_person_owner(old.id) then
    raise exception 'Seul le propriétaire peut archiver ou réactiver ce dossier.';
  end if;
  return new;
end;
$$;

create trigger protected_persons_prevent_owner_change
before update on public.protected_persons
for each row execute function public.prevent_protected_person_owner_change();

create or replace function public.accept_protected_person_invitation(p_token_hash text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation public.protected_person_invitations%rowtype;
declare caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  select * into invitation from public.protected_person_invitations
  where token_hash = p_token_hash and accepted_at is null and expires_at > now() for update;
  if not found or lower(invitation.email) <> caller_email then raise exception 'Invitation invalide ou expirée.'; end if;
  insert into public.protected_person_access(protected_person_id, user_id, role, invited_by)
  values (invitation.protected_person_id, auth.uid(), invitation.role, invitation.invited_by)
  on conflict (protected_person_id, user_id) do nothing;
  update public.protected_person_invitations set accepted_at = now() where id = invitation.id;
  return invitation.protected_person_id;
end;
$$;

alter table public.account_requests enable row level security;
alter table public.protected_person_access enable row level security;
alter table public.protected_person_invitations enable row level security;

create policy "account_requests_public_insert" on public.account_requests
for insert to anon, authenticated with check (
  status = 'pending' and reviewed_at is null and reviewed_by is null
  and invitation_token_hash is null and invitation_expires_at is null and invitation_used_at is null
);
create policy "account_requests_admin_select" on public.account_requests
for select to authenticated using (public.is_platform_admin());
create policy "account_requests_admin_update" on public.account_requests
for update to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "protected_person_access_read_participants" on public.protected_person_access
for select to authenticated using (user_id = auth.uid() or public.is_protected_person_owner(protected_person_id));
create policy "protected_person_access_owner_update" on public.protected_person_access
for update to authenticated using (public.is_protected_person_owner(protected_person_id))
with check (public.is_protected_person_owner(protected_person_id));
create policy "protected_person_access_owner_delete" on public.protected_person_access
for delete to authenticated using (public.is_protected_person_owner(protected_person_id));

create policy "protected_person_invitations_owner_select" on public.protected_person_invitations
for select to authenticated using (public.is_protected_person_owner(protected_person_id));
create policy "protected_person_invitations_owner_insert" on public.protected_person_invitations
for insert to authenticated with check (public.is_protected_person_owner(protected_person_id) and invited_by = auth.uid());
create policy "protected_person_invitations_owner_update" on public.protected_person_invitations
for update to authenticated using (public.is_protected_person_owner(protected_person_id))
with check (public.is_protected_person_owner(protected_person_id));
create policy "protected_person_invitations_owner_delete" on public.protected_person_invitations
for delete to authenticated using (public.is_protected_person_owner(protected_person_id));

drop policy "protected_persons_select_own" on public.protected_persons;
drop policy "protected_persons_update_own" on public.protected_persons;
create policy "protected_persons_select_accessible" on public.protected_persons
for select to authenticated using (public.can_read_protected_person(id));
create policy "protected_persons_update_manage" on public.protected_persons
for update to authenticated using (public.can_manage_protected_person(id))
with check (public.can_manage_protected_person(id));

drop policy "protection_measures_select_own" on public.protection_measures;
drop policy "protection_measures_insert_own" on public.protection_measures;
drop policy "protection_measures_update_own" on public.protection_measures;
create policy "protection_measures_select_accessible" on public.protection_measures
for select to authenticated using (public.can_read_protected_person(protected_person_id));
create policy "protection_measures_insert_manage" on public.protection_measures
for insert to authenticated with check (public.can_manage_protected_person(protected_person_id));
create policy "protection_measures_update_manage" on public.protection_measures
for update to authenticated using (public.can_manage_protected_person(protected_person_id))
with check (public.can_manage_protected_person(protected_person_id));

drop policy "management_periods_select_own" on public.management_periods;
drop policy "management_periods_insert_own" on public.management_periods;
drop policy "management_periods_update_own" on public.management_periods;
drop policy "management_periods_delete_open_own" on public.management_periods;
create policy "management_periods_select_accessible" on public.management_periods
for select to authenticated using (public.can_read_protected_person(protected_person_id));
create policy "management_periods_insert_manage" on public.management_periods
for insert to authenticated with check (public.can_manage_protected_person(protected_person_id));
create policy "management_periods_update_manage" on public.management_periods
for update to authenticated using (public.can_manage_protected_person(protected_person_id))
with check (public.can_manage_protected_person(protected_person_id));
create policy "management_periods_delete_open_manage" on public.management_periods
for delete to authenticated using (status = 'open' and public.can_manage_protected_person(protected_person_id));

drop policy "financial_accounts_select_own" on public.financial_accounts;
drop policy "financial_accounts_insert_own" on public.financial_accounts;
drop policy "financial_accounts_update_own" on public.financial_accounts;
create policy "financial_accounts_select_accessible" on public.financial_accounts
for select to authenticated using (public.can_read_protected_person(protected_person_id));
create policy "financial_accounts_insert_manage" on public.financial_accounts
for insert to authenticated with check (public.can_manage_protected_person(protected_person_id));
create policy "financial_accounts_update_manage" on public.financial_accounts
for update to authenticated using (public.can_manage_protected_person(protected_person_id))
with check (public.can_manage_protected_person(protected_person_id));

drop policy "account_valuations_select_own" on public.account_valuations;
drop policy "account_valuations_insert_own" on public.account_valuations;
drop policy "account_valuations_update_own" on public.account_valuations;
create policy "account_valuations_select_accessible" on public.account_valuations
for select to authenticated using (exists (
  select 1 from public.financial_accounts where id = financial_account_id
  and public.can_read_protected_person(protected_person_id)
));
create policy "account_valuations_insert_manage" on public.account_valuations
for insert to authenticated with check (exists (
  select 1 from public.financial_accounts where id = financial_account_id
  and public.can_manage_protected_person(protected_person_id)
));
create policy "account_valuations_update_manage" on public.account_valuations
for update to authenticated using (exists (
  select 1 from public.financial_accounts where id = financial_account_id
  and public.can_manage_protected_person(protected_person_id)
)) with check (exists (
  select 1 from public.financial_accounts where id = financial_account_id
  and public.can_manage_protected_person(protected_person_id)
));

drop policy "transactions_select_own" on public.transactions;
drop policy "transactions_insert_own_classic" on public.transactions;
drop policy "transactions_update_own_classic" on public.transactions;
drop policy "transactions_delete_own_classic" on public.transactions;
create policy "transactions_select_accessible" on public.transactions
for select to authenticated using (exists (
  select 1 from public.financial_accounts where id = financial_account_id
  and public.can_read_protected_person(protected_person_id)
));
create policy "transactions_insert_manage_classic" on public.transactions
for insert to authenticated with check (transaction_type in ('income', 'expense') and transfer_id is null and exists (
  select 1 from public.financial_accounts where id = financial_account_id
  and public.can_manage_protected_person(protected_person_id)
));
create policy "transactions_update_manage_classic" on public.transactions
for update to authenticated using (transaction_type in ('income', 'expense') and transfer_id is null and exists (
  select 1 from public.financial_accounts where id = financial_account_id
  and public.can_manage_protected_person(protected_person_id)
)) with check (transaction_type in ('income', 'expense') and transfer_id is null and exists (
  select 1 from public.financial_accounts where id = financial_account_id
  and public.can_manage_protected_person(protected_person_id)
));
create policy "transactions_delete_manage_classic" on public.transactions
for delete to authenticated using (transaction_type in ('income', 'expense') and transfer_id is null and exists (
  select 1 from public.financial_accounts where id = financial_account_id
  and public.can_manage_protected_person(protected_person_id)
));

drop policy "transfers_select_own" on public.transfers;
create policy "transfers_select_accessible" on public.transfers
for select to authenticated using (public.can_read_protected_person(protected_person_id));

create or replace function public.create_internal_transfer(
  p_protected_person_id uuid, p_source_account_id uuid, p_destination_account_id uuid,
  p_transfer_date date, p_amount numeric, p_label text default null, p_comment text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  source_account public.financial_accounts%rowtype;
  destination_account public.financial_accounts%rowtype;
  transfer_uuid uuid;
  movement_label text := coalesce(nullif(trim(p_label), ''), 'Virement interne');
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  if not public.can_manage_protected_person(p_protected_person_id) then raise exception 'Dossier introuvable.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Le montant doit être positif.'; end if;
  if p_source_account_id = p_destination_account_id then raise exception 'Les comptes doivent être différents.'; end if;
  select * into source_account from public.financial_accounts where id = p_source_account_id for update;
  select * into destination_account from public.financial_accounts where id = p_destination_account_id for update;
  if source_account.id is null or destination_account.id is null
     or source_account.protected_person_id <> p_protected_person_id
     or destination_account.protected_person_id <> p_protected_person_id then
    raise exception 'Comptes incompatibles avec le dossier.';
  end if;
  if p_transfer_date < source_account.initial_balance_date
     or (source_account.opening_date is not null and p_transfer_date < source_account.opening_date)
     or (source_account.closing_date is not null and p_transfer_date > source_account.closing_date)
     or p_transfer_date < destination_account.initial_balance_date
     or (destination_account.opening_date is not null and p_transfer_date < destination_account.opening_date)
     or (destination_account.closing_date is not null and p_transfer_date > destination_account.closing_date) then
    raise exception 'La date du virement est incompatible avec un compte.';
  end if;
  if exists (select 1 from public.management_periods where protected_person_id = p_protected_person_id
    and status = 'closed' and p_transfer_date between start_date and end_date) then
    raise exception 'Cette date appartient à un exercice clôturé.';
  end if;
  insert into public.transfers (protected_person_id, source_account_id, destination_account_id, transfer_date, amount, label, comment)
  values (p_protected_person_id, p_source_account_id, p_destination_account_id, p_transfer_date, p_amount, nullif(trim(p_label), ''), nullif(trim(p_comment), ''))
  returning id into transfer_uuid;
  insert into public.transactions (financial_account_id, transaction_date, transaction_type, label, amount, transfer_id, comment)
  values (p_source_account_id, p_transfer_date, 'transfer_out', movement_label, p_amount, transfer_uuid, nullif(trim(p_comment), '')),
         (p_destination_account_id, p_transfer_date, 'transfer_in', movement_label, p_amount, transfer_uuid, nullif(trim(p_comment), ''));
  return transfer_uuid;
end;
$$;

create or replace function public.delete_internal_transfer(p_transfer_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare transfer_row public.transfers%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  select * into transfer_row from public.transfers where id = p_transfer_id for update;
  if not found or not public.can_manage_protected_person(transfer_row.protected_person_id) then
    raise exception 'Virement introuvable.';
  end if;
  if exists (select 1 from public.management_periods where protected_person_id = transfer_row.protected_person_id
    and status = 'closed' and transfer_row.transfer_date between start_date and end_date) then
    raise exception 'Ce virement appartient à un exercice clôturé.';
  end if;
  delete from public.transactions where transfer_id = p_transfer_id;
  delete from public.transfers where id = p_transfer_id;
end;
$$;

grant insert on public.account_requests to anon, authenticated;
grant select, update on public.account_requests to authenticated;
grant select, update (role), delete on public.protected_person_access to authenticated;
grant select, insert, update (role, expires_at), delete on public.protected_person_invitations to authenticated;
revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_protected_person_owner(uuid) from public;
revoke all on function public.can_read_protected_person(uuid) from public;
revoke all on function public.can_manage_protected_person(uuid) from public;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_protected_person_owner(uuid) to authenticated;
grant execute on function public.can_read_protected_person(uuid) to authenticated;
grant execute on function public.can_manage_protected_person(uuid) to authenticated;
revoke all on function public.accept_protected_person_invitation(text) from public;
grant execute on function public.accept_protected_person_invitation(text) to authenticated;
