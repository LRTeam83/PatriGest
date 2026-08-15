create or replace function public.protect_property_and_debt_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'real_estate_properties' then
    if new.protected_person_id <> old.protected_person_id then
      raise exception 'Le rattachement au dossier ne peut pas être modifié.';
    end if;
  elsif tg_table_name = 'debts' then
    if new.protected_person_id <> old.protected_person_id then
      raise exception 'Le rattachement au dossier ne peut pas être modifié.';
    end if;
  elsif tg_table_name = 'property_events' then
    if (new.property_id, new.protected_person_id)
       is distinct from
       (old.property_id, old.protected_person_id) then
      raise exception 'Le rattachement de l’événement ne peut pas être modifié.';
    end if;
  elsif tg_table_name = 'debt_balances' then
    if new.debt_id <> old.debt_id then
      raise exception 'Le rattachement de la situation ne peut pas être modifié.';
    end if;
  end if;

  return new;
end;
$$;
