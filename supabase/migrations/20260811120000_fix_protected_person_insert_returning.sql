drop policy if exists "protected_persons_select_accessible" on public.protected_persons;

create policy "protected_persons_select_accessible" on public.protected_persons
for select to authenticated using (
  owner_id = (select auth.uid())
  or public.can_read_protected_person(id)
);
