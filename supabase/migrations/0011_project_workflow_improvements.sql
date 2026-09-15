begin;

alter table public.projects
  add column if not exists insights text;

create sequence if not exists task_id_seq start with 100;
alter table public.tasks
  alter column id set default ('T-' || nextval('task_id_seq')::text),
  add column if not exists start_date date,
  add column if not exists end_date date;

grant usage, select on sequence task_id_seq to authenticated;

alter table public.tasks drop constraint if exists tasks_date_order_check;
alter table public.tasks add constraint tasks_date_order_check
  check (start_date is null or end_date is null or start_date <= end_date);

commit;
