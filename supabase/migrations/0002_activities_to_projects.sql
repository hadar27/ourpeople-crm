-- Drop the `activities` catalog table entirely; link participants, volunteers,
-- and donations directly to `projects` via a real project_id FK instead.
--
-- Activity -> project backfill mapping (by domain meaning, no activity name
-- exactly matches a project name):
--   ACT-1 קייטנת קיץ            -> PR-01 קייטנת קיץ 2025
--   ACT-2 סדנת העצמה נשים        -> PR-04 סדנת העצמה לנשים
--   ACT-3 ליווי משפחות           -> PR-03 ליווי משפחות עולים
--   ACT-4 תכנית נוער             -> PR-02 תכנית נוער שכונתית
--   ACT-5 סיוע למשפחות עולים     -> PR-03 ליווי משפחות עולים (merged with ACT-3)
--   ACT-6 חירום ושיקום           -> PR-05 חירום ושיקום קהילתי
--   ACT-7 מועדון נוער            -> PR-06 מועדונית אחה"צ (merged with none, own row)
--
-- Wrapped in an explicit transaction and written with if-exists/if-not-exists
-- guards throughout so it's safe to re-run from scratch even after a partial
-- failure (e.g. if an earlier attempt got partway through before erroring).

begin;

-- 1. projects gains the free/paid catalog concept activities used to carry.
alter table public.projects add column if not exists type text not null default 'חינמית' check (type in ('חינמית', 'בתשלום'));
alter table public.projects add column if not exists price numeric not null default 0;

update public.projects set type = 'בתשלום', price = 850 where id = 'PR-01';
update public.projects set type = 'בתשלום', price = 200 where id = 'PR-02';
update public.projects set type = 'חינמית', price = 0   where id = 'PR-03';
update public.projects set type = 'בתשלום', price = 300 where id = 'PR-04';
update public.projects set type = 'חינמית', price = 0   where id = 'PR-05';
update public.projects set type = 'חינמית', price = 0   where id = 'PR-06';

-- 2. participants: activity_id (not null) -> project_id (not null).
alter table public.participants add column if not exists project_id text references public.projects(id);
update public.participants set project_id = case activity_id
  when 'ACT-1' then 'PR-01'
  when 'ACT-2' then 'PR-04'
  when 'ACT-3' then 'PR-03'
  when 'ACT-4' then 'PR-02'
  when 'ACT-5' then 'PR-03'
  when 'ACT-6' then 'PR-05'
  when 'ACT-7' then 'PR-06'
end
where activity_id is not null;
alter table public.participants alter column project_id set not null;

-- 3. volunteers: activity_id (nullable) -> project_id (nullable).
alter table public.volunteers add column if not exists project_id text references public.projects(id);
update public.volunteers set project_id = case activity_id
  when 'ACT-1' then 'PR-01'
  when 'ACT-2' then 'PR-04'
  when 'ACT-3' then 'PR-03'
  when 'ACT-4' then 'PR-02'
  when 'ACT-5' then 'PR-03'
  when 'ACT-6' then 'PR-05'
  when 'ACT-7' then 'PR-06'
end
where activity_id is not null;

-- 4. donations: activity_id merges into the existing project_id column.
-- Drop the mutual-exclusivity check first — it would otherwise reject rows
-- that briefly have both project_id and activity_id set during backfill.
alter table public.donations drop constraint if exists donations_check;
update public.donations set project_id = coalesce(project_id, case activity_id
  when 'ACT-1' then 'PR-01'
  when 'ACT-2' then 'PR-04'
  when 'ACT-3' then 'PR-03'
  when 'ACT-4' then 'PR-02'
  when 'ACT-5' then 'PR-03'
  when 'ACT-6' then 'PR-05'
  when 'ACT-7' then 'PR-06'
end)
where activity_id is not null;

-- 5. drop now-redundant columns.
alter table public.participants drop column if exists activity_id;
alter table public.participants drop column if exists activity_type;
alter table public.volunteers drop column if exists activity_id;
alter table public.volunteers drop column if exists project_label;
alter table public.donations drop column if exists activity_id;

-- 6. drop the activities table and its supporting sequence/function.
drop table if exists public.activities;
drop sequence if exists activity_id_seq;
drop function if exists next_activity_id();

commit;
