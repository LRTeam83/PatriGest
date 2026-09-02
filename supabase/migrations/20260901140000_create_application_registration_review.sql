-- Administrative registration decisions are restricted to one-way transitions
-- from pending and are audited with the authenticated platform administrator.
create or replace function public.review_application_user_registration(
  p_user_id uuid,
  p_decision text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status text;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception 'Accès administrateur requis.';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas modifier votre propre autorisation.';
  end if;

  if p_decision not in ('active', 'rejected') then
    raise exception 'Décision invalide.';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Utilisateur introuvable.';
  end if;

  select status
  into v_current_status
  from public.application_user_authorizations
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Autorisation utilisateur introuvable.';
  end if;

  if v_current_status <> 'pending' then
    raise exception 'Cette inscription a déjà été traitée.';
  end if;

  update public.application_user_authorizations
  set status = p_decision,
      status_changed_at = now(),
      status_changed_by = auth.uid()
  where user_id = p_user_id;

  return p_decision;
end;
$$;

revoke all on function public.review_application_user_registration(uuid, text)
from public, anon, service_role;

grant execute on function public.review_application_user_registration(uuid, text)
to authenticated;
