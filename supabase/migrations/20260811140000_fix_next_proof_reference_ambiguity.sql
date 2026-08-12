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
  v_reference_year integer := extract(year from p_transaction_date)::integer;
  next_number bigint;
  generated_reference text;
begin
  insert into public.proof_reference_counters (
    protected_person_id,
    reference_year,
    last_number,
    updated_at
  )
  values (
    p_protected_person_id,
    v_reference_year,
    1,
    now()
  )
  on conflict (protected_person_id, reference_year)
  do update set
    last_number = public.proof_reference_counters.last_number + 1,
    updated_at = now()
  returning last_number into next_number;

  generated_reference :=
    v_reference_year::text || '-' || lpad(next_number::text, 4, '0');

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
    v_reference_year,
    next_number,
    generated_reference
  );

  return generated_reference;
end;
$$;

revoke all on function public.next_proof_reference(uuid, date, uuid) from public;
