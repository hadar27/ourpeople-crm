-- Participant payments are binary: paid or unpaid (free projects require no payment).

alter table public.participants
  drop constraint if exists participants_payment_status_check;

update public.participants
set payment_status = 'לא שולם'
where payment_status = 'שולם חלקית';

alter table public.participants
  add constraint participants_payment_status_check
  check (payment_status in ('שולם', 'לא שולם', 'לא נדרש תשלום'));

alter table public.pending_participant_registrations
  drop constraint if exists pending_participant_registrations_payment_status_check;

update public.pending_participant_registrations
set payment_status = 'לא שולם'
where payment_status = 'שולם חלקית';

alter table public.pending_participant_registrations
  add constraint pending_participant_registrations_payment_status_check
  check (payment_status in ('שולם', 'לא שולם', 'לא נדרש תשלום'));

alter table public.project_participants
  drop constraint if exists project_participants_payment_status_check;

update public.project_participants
set payment_status = 'לא שולם'
where payment_status = 'שולם חלקית';

alter table public.project_participants
  add constraint project_participants_payment_status_check
  check (payment_status in ('שולם', 'לא שולם', 'לא נדרש תשלום'));
