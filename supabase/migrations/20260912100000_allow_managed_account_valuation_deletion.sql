drop policy "account_valuations_delete_denied" on public.account_valuations;

create policy "account_valuations_delete_manage"
on public.account_valuations for delete to authenticated
using (exists (
  select 1
  from public.financial_accounts
  where id = financial_account_id
    and public.can_manage_protected_person(protected_person_id)
));

grant delete on public.account_valuations to authenticated;
