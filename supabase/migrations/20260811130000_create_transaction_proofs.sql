create table public.proof_reference_counters (
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  reference_year integer not null check (reference_year between 1900 and 9999),
  last_number bigint not null check (last_number > 0),
  updated_at timestamptz not null default now(),
  primary key (protected_person_id, reference_year)
);

create table public.proof_reference_assignments (
  transaction_id uuid primary key references public.transactions(id) on delete cascade deferrable initially deferred,
  protected_person_id uuid not null references public.protected_persons(id) on delete restrict,
  reference_year integer not null check (reference_year between 1900 and 9999),
  reference_number bigint not null check (reference_number > 0),
  proof_reference text not null,
  created_at timestamptz not null default now(),
  unique (protected_person_id, reference_year, reference_number),
  unique (protected_person_id, proof_reference)
);

create or replace function public.next_proof_reference(
  p_protected_person_id uuid,
  p_transaction_date date,
  p_transaction_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  reference_year integer := extract(year from p_transaction_date)::integer;
  next_number bigint;
  generated_reference text;
begin
  insert into public.proof_reference_counters (
    protected_person_id,
    reference_year,
    last_number,
    updated_at
  )
  values (p_protected_person_id, reference_year, 1, now())
  on conflict (protected_person_id, reference_year)
  do update set
    last_number = public.proof_reference_counters.last_number + 1,
    updated_at = now()
  returning last_number into next_number;

  generated_reference := reference_year::text || '-' || lpad(next_number::text, 4, '0');

  insert into public.proof_reference_assignments (
    transaction_id,
    protected_person_id,
    reference_year,
    reference_number,
    proof_reference
  )
  values (
    p_transaction_id,
    p_protected_person_id,
    reference_year,
    next_number,
    generated_reference
  );

  return generated_reference;
end;
$$;

create or replace function public.manage_expense_proof_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  person_id uuid;
  account_kind text;
begin
  select protected_person_id, account_type
  into person_id, account_kind
  from public.financial_accounts
  where id = new.financial_account_id;

  if person_id is null then
    raise exception 'Compte introuvable.';
  end if;

  if new.transaction_type in ('income', 'expense')
     and account_kind in ('life_insurance', 'other_investment') then
    raise exception 'Les recettes et dépenses nécessitent un compte transactionnel.';
  end if;

  if tg_op = 'INSERT' then
    if new.transaction_type = 'expense' then
      new.proof_reference := public.next_proof_reference(person_id, new.transaction_date, new.id);
    else
      new.proof_reference := null;
    end if;
    return new;
  end if;

  if old.transaction_type = 'expense' and old.proof_reference is not null then
    if extract(year from new.transaction_date) <> extract(year from old.transaction_date) then
      raise exception 'Une dépense numérotée ne peut pas être déplacée vers une autre année.';
    end if;
    new.proof_reference := old.proof_reference;
  elsif new.transaction_type = 'expense' and old.transaction_type <> 'expense' then
    new.proof_reference := public.next_proof_reference(person_id, new.transaction_date, new.id);
  else
    new.proof_reference := null;
  end if;

  return new;
end;
$$;

create trigger transactions_manage_expense_proof_reference
before insert or update of financial_account_id, transaction_date, transaction_type, proof_reference
on public.transactions
for each row execute function public.manage_expense_proof_reference();

create table public.transaction_documents (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null unique references public.transactions(id) on delete restrict,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.protect_transaction_document_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
     or new.transaction_id <> old.transaction_id
     or new.storage_path <> old.storage_path
     or new.created_by <> old.created_by
     or new.created_at <> old.created_at then
    raise exception 'Le rattachement du justificatif ne peut pas être modifié.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger transaction_documents_protect_identity
before update on public.transaction_documents
for each row execute function public.protect_transaction_document_identity();

alter table public.proof_reference_counters enable row level security;
alter table public.proof_reference_assignments enable row level security;
alter table public.transaction_documents enable row level security;

create policy "transaction_documents_select_accessible" on public.transaction_documents
for select to authenticated using (exists (
  select 1
  from public.transactions transaction
  join public.financial_accounts account on account.id = transaction.financial_account_id
  where transaction.id = transaction_documents.transaction_id
    and public.can_read_protected_person(account.protected_person_id)
));

create policy "transaction_documents_insert_manage" on public.transaction_documents
for insert to authenticated with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.transactions transaction
    join public.financial_accounts account on account.id = transaction.financial_account_id
    where transaction.id = transaction_documents.transaction_id
      and transaction.transaction_type = 'expense'
      and public.can_manage_protected_person(account.protected_person_id)
  )
);

create policy "transaction_documents_update_manage" on public.transaction_documents
for update to authenticated using (exists (
  select 1
  from public.transactions transaction
  join public.financial_accounts account on account.id = transaction.financial_account_id
  where transaction.id = transaction_documents.transaction_id
    and public.can_manage_protected_person(account.protected_person_id)
)) with check (
  exists (
    select 1
    from public.transactions transaction
    join public.financial_accounts account on account.id = transaction.financial_account_id
    where transaction.id = transaction_documents.transaction_id
      and transaction.transaction_type = 'expense'
      and public.can_manage_protected_person(account.protected_person_id)
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'transaction-proofs',
  'transaction-proofs',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "transaction_proofs_select_accessible" on storage.objects
for select to authenticated using (
  bucket_id = 'transaction-proofs'
  and (storage.foldername(name))[1] = 'protected-persons'
  and (storage.foldername(name))[3] = 'transactions'
  and storage.filename(name) = 'proof'
  and public.can_read_protected_person(((storage.foldername(name))[2])::uuid)
  and exists (
    select 1
    from public.transactions transaction
    join public.financial_accounts account on account.id = transaction.financial_account_id
    where transaction.id = ((storage.foldername(name))[4])::uuid
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
  )
);

create policy "transaction_proofs_insert_manage" on storage.objects
for insert to authenticated with check (
  bucket_id = 'transaction-proofs'
  and (storage.foldername(name))[1] = 'protected-persons'
  and (storage.foldername(name))[3] = 'transactions'
  and storage.filename(name) = 'proof'
  and public.can_manage_protected_person(((storage.foldername(name))[2])::uuid)
  and exists (
    select 1
    from public.transactions transaction
    join public.financial_accounts account on account.id = transaction.financial_account_id
    where transaction.id = ((storage.foldername(name))[4])::uuid
      and transaction.transaction_type = 'expense'
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
  )
);

create policy "transaction_proofs_update_manage" on storage.objects
for update to authenticated using (
  bucket_id = 'transaction-proofs'
  and (storage.foldername(name))[1] = 'protected-persons'
  and (storage.foldername(name))[3] = 'transactions'
  and storage.filename(name) = 'proof'
  and public.can_manage_protected_person(((storage.foldername(name))[2])::uuid)
  and exists (
    select 1
    from public.transactions transaction
    join public.financial_accounts account on account.id = transaction.financial_account_id
    where transaction.id = ((storage.foldername(name))[4])::uuid
      and transaction.transaction_type = 'expense'
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
  )
) with check (
  bucket_id = 'transaction-proofs'
  and (storage.foldername(name))[1] = 'protected-persons'
  and (storage.foldername(name))[3] = 'transactions'
  and storage.filename(name) = 'proof'
  and public.can_manage_protected_person(((storage.foldername(name))[2])::uuid)
  and exists (
    select 1
    from public.transactions transaction
    join public.financial_accounts account on account.id = transaction.financial_account_id
    where transaction.id = ((storage.foldername(name))[4])::uuid
      and transaction.transaction_type = 'expense'
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
  )
);

create or replace function public.protect_transaction_proof_storage_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.bucket_id = 'transaction-proofs'
     and (new.bucket_id <> old.bucket_id or new.name <> old.name) then
    raise exception 'Le rattachement Storage du justificatif ne peut pas être modifié.';
  end if;
  return new;
end;
$$;

create trigger transaction_proofs_protect_storage_identity
before update on storage.objects
for each row
when (old.bucket_id = 'transaction-proofs')
execute function public.protect_transaction_proof_storage_identity();

revoke all on table public.proof_reference_counters from anon, authenticated;
revoke all on table public.proof_reference_assignments from anon, authenticated;
revoke all on table public.transaction_documents from anon, authenticated;
grant select, insert, update on table public.transaction_documents to authenticated;

revoke all on function public.next_proof_reference(uuid, date, uuid) from public;
revoke all on function public.manage_expense_proof_reference() from public;
revoke all on function public.protect_transaction_document_identity() from public;
revoke all on function public.protect_transaction_proof_storage_identity() from public;
