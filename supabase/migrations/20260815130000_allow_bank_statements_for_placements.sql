drop policy if exists "bank_statements_insert_manage" on public.bank_statements;
create policy "bank_statements_insert_manage" on public.bank_statements
for insert to authenticated with check (
  created_by = auth.uid() and exists (
    select 1 from public.financial_accounts account
    where account.id = bank_statements.financial_account_id
      and public.can_manage_protected_person(account.protected_person_id)
  )
);

drop policy if exists "bank_statements_update_manage" on public.bank_statements;
create policy "bank_statements_update_manage" on public.bank_statements
for update to authenticated using (exists (
  select 1 from public.financial_accounts account
  where account.id = bank_statements.financial_account_id
    and public.can_manage_protected_person(account.protected_person_id)
)) with check (exists (
  select 1 from public.financial_accounts account
  where account.id = bank_statements.financial_account_id
    and public.can_manage_protected_person(account.protected_person_id)
));

drop policy if exists "bank_statements_storage_insert_manage" on storage.objects;
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
      and public.can_manage_protected_person(account.protected_person_id)
  )
);

drop policy if exists "bank_statements_storage_update_manage" on storage.objects;
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
      and public.can_manage_protected_person(account.protected_person_id)
  )
);
