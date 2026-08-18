create policy "management_report_transmissions_executor_select"
on public.management_report_transmissions
for select
to patrigest_management_report_transmission_executor
using (true);

revoke execute on function public.declare_management_report_transmission(
  uuid, date, text, text, text
) from public, anon, service_role;

grant execute on function public.declare_management_report_transmission(
  uuid, date, text, text, text
) to authenticated;
