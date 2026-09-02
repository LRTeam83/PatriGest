revoke execute on function public.accept_protected_person_invitation(text)
from anon, service_role;

revoke execute on function public.issue_protected_person_invitation(
  uuid,
  text,
  text,
  text,
  timestamptz
)
from anon, service_role;

revoke execute on function public.reissue_protected_person_invitation(
  uuid,
  text,
  timestamptz
)
from anon, service_role;

revoke execute on function public.revoke_protected_person_invitation(uuid)
from anon, service_role;
