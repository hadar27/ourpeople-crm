-- Keep volunteer status intentionally binary across the application.
-- Existing paused/archived records become inactive before the new checks apply.

alter table public.volunteers
  drop constraint if exists volunteers_status_check;

update public.volunteers
set status = 'לא פעיל'
where status in ('בהפסקה', 'ארכיון');

alter table public.volunteers
  add constraint volunteers_status_check
  check (status in ('פעיל', 'לא פעיל'));

alter table public.pending_volunteer_registrations
  drop constraint if exists pending_volunteer_registrations_status_check;

update public.pending_volunteer_registrations
set status = 'לא פעיל'
where status in ('בהפסקה', 'ארכיון');

alter table public.pending_volunteer_registrations
  add constraint pending_volunteer_registrations_status_check
  check (status in ('פעיל', 'לא פעיל'));
