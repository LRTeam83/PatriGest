create extension if not exists btree_gist;

alter table public.management_periods
add constraint management_periods_no_overlap
exclude using gist (
  protected_person_id with =,
  daterange(start_date, end_date, '[]') with &&
);
