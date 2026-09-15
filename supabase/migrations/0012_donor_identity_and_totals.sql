begin;

alter table public.donors
  add column if not exists id_number text;

alter table public.donors drop constraint if exists donors_id_number_format_check;
alter table public.donors add constraint donors_id_number_format_check
  check (id_number is null or id_number ~ '^[0-9]{9}$');

create or replace function public.refresh_donor_totals(target_donor_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.donors
  set total_donated = coalesce((
        select sum(amount) from public.donations where donor_id = target_donor_id
      ), 0),
      last_donation = (
        select max(date) from public.donations where donor_id = target_donor_id
      ),
      updated_at = now()
  where id = target_donor_id;
$$;

create or replace function public.sync_donor_totals_after_donation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.donor_id is not null then
    perform public.refresh_donor_totals(old.donor_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.donor_id is not null then
    perform public.refresh_donor_totals(new.donor_id);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists donations_sync_donor_totals on public.donations;
create trigger donations_sync_donor_totals
after insert or update or delete on public.donations
for each row execute function public.sync_donor_totals_after_donation();

update public.donors d
set total_donated = coalesce(x.total, 0),
    last_donation = x.last_date,
    updated_at = now()
from (
  select d2.id,
         sum(dn.amount) filter (where dn.id is not null) as total,
         max(dn.date) as last_date
  from public.donors d2
  left join public.donations dn on dn.donor_id = d2.id
  group by d2.id
) x
where d.id = x.id;

commit;
