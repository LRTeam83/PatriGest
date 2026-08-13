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
     or exists (select 1 from public.account_valuations where financial_account_id = p_account_id) then
    raise exception 'Ce compte ne peut pas être supprimé tant qu''il contient des opérations, virements, valorisations ou justificatifs.';
  end if;

  delete from public.financial_accounts where id = p_account_id;
end;
$$;

create or replace function public.delete_empty_protected_person(p_protected_person_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  select owner_id
  into v_owner_id
  from public.protected_persons
  where id = p_protected_person_id
    and owner_id = (select auth.uid())
  for update;

  if v_owner_id is null then
    raise exception 'Dossier introuvable ou suppression non autorisée.';
  end if;

  if exists (select 1 from public.financial_accounts where protected_person_id = p_protected_person_id)
     or exists (select 1 from public.protection_measures where protected_person_id = p_protected_person_id)
     or exists (select 1 from public.management_periods where protected_person_id = p_protected_person_id)
     or exists (select 1 from public.protected_person_access where protected_person_id = p_protected_person_id)
     or exists (select 1 from public.protected_person_invitations where protected_person_id = p_protected_person_id)
     or exists (select 1 from public.transfers where protected_person_id = p_protected_person_id)
     or exists (select 1 from public.proof_reference_assignments where protected_person_id = p_protected_person_id) then
    raise exception 'Ce dossier ne peut pas être supprimé tant qu''il contient des comptes ou d''autres données associées.';
  end if;

  delete from public.proof_reference_counters
  where protected_person_id = p_protected_person_id;

  delete from public.protected_persons
  where id = p_protected_person_id;
end;
$$;

revoke all on function public.delete_empty_financial_account(uuid) from public;
revoke all on function public.delete_empty_protected_person(uuid) from public;
grant execute on function public.delete_empty_financial_account(uuid) to authenticated;
grant execute on function public.delete_empty_protected_person(uuid) to authenticated;
