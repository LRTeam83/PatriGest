alter table public.management_reports
add constraint management_reports_no_overlap
exclude using gist (
  protected_person_id with =,
  daterange(period_start, period_end, '[]') with &&
);
