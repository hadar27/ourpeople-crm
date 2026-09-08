-- project_expenses had no id default (seed data used manual PE-n ids), so
-- inserting from the UI had no way to generate an id. Add the same
-- next_<x>_id() sequence pattern used by every other table, continuing from
-- the highest seeded id (PE-21).
create sequence if not exists project_expense_id_seq start with 22;
create or replace function next_project_expense_id() returns text
language sql as $$
  select 'PE-' || nextval('project_expense_id_seq')::text;
$$;

alter table public.project_expenses
  alter column id set default next_project_expense_id();
