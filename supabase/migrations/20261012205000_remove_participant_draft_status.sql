-- Participant registrations are submitted directly for review; drafts are not used.

alter table public.participants
  drop constraint if exists participants_status_check;

update public.participants
set status = 'ממתין לאישור'
where status = 'טיוטה';

alter table public.participants
  add constraint participants_status_check
  check (status in ('מאושר', 'ממתין לתשלום', 'ממתין לאישור'));

alter table public.pending_participant_registrations
  drop constraint if exists pending_participant_registrations_status_check;

update public.pending_participant_registrations
set status = 'ממתין לאישור'
where status = 'טיוטה';

alter table public.pending_participant_registrations
  add constraint pending_participant_registrations_status_check
  check (status in ('מאושר', 'ממתין לתשלום', 'ממתין לאישור'));
