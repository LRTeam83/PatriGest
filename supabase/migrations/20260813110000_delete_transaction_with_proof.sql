create or replace function public.delete_transaction_with_document(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_protected_person_id uuid;
  v_transaction_date date;
begin
  select account.protected_person_id, transaction.transaction_date
  into v_protected_person_id, v_transaction_date
  from public.transactions transaction
  join public.financial_accounts account on account.id = transaction.financial_account_id
  where transaction.id = p_transaction_id
    and transaction.transaction_type in ('income', 'expense')
    and transaction.transfer_id is null
  for update of transaction;

  if v_protected_person_id is null
     or not public.can_manage_protected_person(v_protected_person_id) then
    raise exception 'Opération introuvable ou suppression non autorisée.';
  end if;

  if exists (
    select 1
    from public.management_periods
    where protected_person_id = v_protected_person_id
      and status = 'closed'
      and v_transaction_date between start_date and end_date
  ) then
    raise exception 'Cette opération appartient à un exercice clôturé.';
  end if;

  delete from public.transaction_documents
  where transaction_id = p_transaction_id;

  delete from public.transactions
  where id = p_transaction_id;
end;
$$;

create policy "transaction_proofs_delete_manage" on storage.objects
for delete to authenticated using (
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
      and transaction.transfer_id is null
      and account.protected_person_id = ((storage.foldername(name))[2])::uuid
  )
);

revoke all on function public.delete_transaction_with_document(uuid) from public;
grant execute on function public.delete_transaction_with_document(uuid) to authenticated;
