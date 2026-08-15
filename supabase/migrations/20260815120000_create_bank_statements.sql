create table public.bank_statements (
  id uuid primary key default gen_random_uuid(),
  financial_account_id uuid not null references public.financial_accounts(id) on delete restrict,
  statement_start_date date,
  statement_end_date date not null,
  statement_balance numeric(15,2),
  storage_path text not null unique,
  original_file_name text not null,
  mime_type text not null check (mime_type = 'application/pdf'),
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  note text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (financial_account_id, statement_end_date),
  constraint bank_statements_period_order check (
    statement_start_date is null or statement_start_date <= statement_end_date
  )
);

create index bank_statements_account_end_date_idx
on public.bank_statements(financial_account_id, statement_end_date desc);

create or replace function public.protect_bank_statement_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id
     or new.financial_account_id <> old.financial_account_id
     or new.storage_path <> old.storage_path
     or new.created_by <> old.created_by
     or new.created_at <> old.created_at then
    raise exception 'Le rattachement du relevé ne peut pas être modifié.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger bank_statements_protect_identity
before update on public.bank_statements
for each row execute function public.protect_bank_statement_identity();

alter table public.bank_statements enable row level security;

create policy "bank_statements_select_accessible" on public.bank_statements
for select to authenticated using (exists (
  select 1 from public.financial_accounts account
  where account.id = bank_statements.financial_account_id
    and public.can_read_protected_person(account.protected_person_id)
));
create policy "bank_statements_insert_manage" on public.bank_statements
for insert to authenticated with check (
  created_by = auth.uid() and exists (
    select 1 from public.financial_accounts account
    where account.id = bank_statements.financial_account_id
      and account.account_type not in ('life_insurance', 'other_investment')
      and public.can_manage_protected_person(account.protected_person_id)
  )
);
create policy "bank_statements_update_manage" on public.bank_statements
for update to authenticated using (exists (
  select 1 from public.financial_accounts account
  where account.id = bank_statements.financial_account_id
    and public.can_manage_protected_person(account.protected_person_id)
)) with check (exists (
  select 1 from public.financial_accounts account
  where account.id = bank_statements.financial_account_id
    and account.account_type not in ('life_insurance', 'other_investment')
    and public.can_manage_protected_person(account.protected_person_id)
));
create policy "bank_statements_delete_manage" on public.bank_statements
for delete to authenticated using (exists (
  select 1 from public.financial_accounts account
  where account.id = bank_statements.financial_account_id
    and public.can_manage_protected_person(account.protected_person_id)
));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bank-statements', 'bank-statements', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
allowed_mime_types = excluded.allowed_mime_types;

create policy "bank_statements_storage_select_accessible" on storage.objects
for select to authenticated using (
  bucket_id = 'bank-statements'
  and array_length(storage.foldername(name), 1) = 6
  and (storage.foldername(name))[1] = 'protected-persons'
  and (storage.foldername(name))[3] = 'accounts'
  and (storage.foldername(name))[5] = 'statements'
  and storage.filename(name) = 'statement'
  and exists (
    select 1 from public.bank_statements bank_statement
    join public.financial_accounts account on account.id = bank_statement.financial_account_id
    where bank_statement.id = ((storage.foldername(name))[6])::uuid
      and bank_statement.financial_account_id = ((storage.foldername(name))[4])::uuid
      and bank_statement.storage_path = name
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
      and public.can_read_protected_person(account.protected_person_id)
  )
);
create policy "bank_statements_storage_insert_manage" on storage.objects
for insert to authenticated with check (
  bucket_id = 'bank-statements'
  and array_length(storage.foldername(name), 1) = 6
  and (storage.foldername(name))[1] = 'protected-persons'
  and (storage.foldername(name))[3] = 'accounts'
  and (storage.foldername(name))[5] = 'statements'
  and storage.filename(name) = 'statement'
  and exists (
    select 1 from public.bank_statements bank_statement
    join public.financial_accounts account on account.id = bank_statement.financial_account_id
    where bank_statement.id = ((storage.foldername(name))[6])::uuid
      and bank_statement.financial_account_id = ((storage.foldername(name))[4])::uuid
      and bank_statement.storage_path = name
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
      and account.account_type not in ('life_insurance', 'other_investment')
      and public.can_manage_protected_person(account.protected_person_id)
  )
);
create policy "bank_statements_storage_update_manage" on storage.objects
for update to authenticated using (
  bucket_id = 'bank-statements'
  and array_length(storage.foldername(name), 1) = 6
  and (storage.foldername(name))[1] = 'protected-persons'
  and (storage.foldername(name))[3] = 'accounts'
  and (storage.foldername(name))[5] = 'statements'
  and storage.filename(name) = 'statement'
  and exists (
    select 1 from public.bank_statements bank_statement
    join public.financial_accounts account on account.id = bank_statement.financial_account_id
    where bank_statement.id = ((storage.foldername(name))[6])::uuid
      and bank_statement.financial_account_id = ((storage.foldername(name))[4])::uuid
      and bank_statement.storage_path = name
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
      and account.account_type not in ('life_insurance', 'other_investment')
      and public.can_manage_protected_person(account.protected_person_id)
  )
) with check (
  bucket_id = 'bank-statements'
  and array_length(storage.foldername(name), 1) = 6
  and (storage.foldername(name))[1] = 'protected-persons'
  and (storage.foldername(name))[3] = 'accounts'
  and (storage.foldername(name))[5] = 'statements'
  and storage.filename(name) = 'statement'
  and exists (
    select 1 from public.bank_statements bank_statement
    join public.financial_accounts account on account.id = bank_statement.financial_account_id
    where bank_statement.id = ((storage.foldername(name))[6])::uuid
      and bank_statement.financial_account_id = ((storage.foldername(name))[4])::uuid
      and bank_statement.storage_path = name
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
      and account.account_type not in ('life_insurance', 'other_investment')
      and public.can_manage_protected_person(account.protected_person_id)
  )
);
create policy "bank_statements_storage_delete_manage" on storage.objects
for delete to authenticated using (
  bucket_id = 'bank-statements'
  and array_length(storage.foldername(name), 1) = 6
  and (storage.foldername(name))[1] = 'protected-persons'
  and (storage.foldername(name))[3] = 'accounts'
  and (storage.foldername(name))[5] = 'statements'
  and storage.filename(name) = 'statement'
  and exists (
    select 1 from public.bank_statements bank_statement
    join public.financial_accounts account on account.id = bank_statement.financial_account_id
    where bank_statement.id = ((storage.foldername(name))[6])::uuid
      and bank_statement.financial_account_id = ((storage.foldername(name))[4])::uuid
      and bank_statement.storage_path = name
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
      and public.can_manage_protected_person(account.protected_person_id)
  )
);

create or replace function public.protect_bank_statement_storage_identity()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.bucket_id = 'bank-statements'
     and (new.bucket_id <> old.bucket_id or new.name <> old.name) then
    raise exception 'Le rattachement Storage du relevé ne peut pas être modifié.';
  end if;
  return new;
end;
$$;
create trigger bank_statements_protect_storage_identity
before update on storage.objects for each row
when (old.bucket_id = 'bank-statements')
execute function public.protect_bank_statement_storage_identity();

grant select, insert, update, delete on public.bank_statements to authenticated;
revoke all on function public.protect_bank_statement_identity() from public;
revoke all on function public.protect_bank_statement_storage_identity() from public;

-- Preserve the complete function applied by 20260813100000 and add only the
-- bank statement dependency introduced by this migration.
create or replace function public.delete_empty_financial_account(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_person_id uuid;
begin
  select account.protected_person_id
  into v_person_id
  from public.financial_accounts account
  join public.protected_persons person on person.id = account.protected_person_id
  where account.id = p_account_id
    and person.owner_id = (select auth.uid())
  for update of account;

  if v_person_id is null then
    raise exception 'Compte introuvable ou suppression non autorisée.';
  end if;

  if exists (select 1 from public.transactions where financial_account_id = p_account_id)
     or exists (select 1 from public.transfers where source_account_id = p_account_id or destination_account_id = p_account_id)
     or exists (select 1 from public.account_valuations where financial_account_id = p_account_id)
     or exists (select 1 from public.bank_statements where financial_account_id = p_account_id) then
    raise exception 'Ce compte ne peut pas être supprimé tant qu''il contient des opérations, virements, valorisations, justificatifs ou relevés bancaires.';
  end if;

  delete from public.financial_accounts where id = p_account_id;
end;
$$;

revoke all on function public.delete_empty_financial_account(uuid) from public;
grant execute on function public.delete_empty_financial_account(uuid) to authenticated;
