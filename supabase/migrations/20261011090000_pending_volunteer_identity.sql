-- Store the volunteer's identity number from the public project-registration form.
-- Existing pending submissions remain valid; the application requires the field for new ones.
alter table public.pending_volunteer_registrations
  add column if not exists id_number text;

create unique index if not exists pending_volunteer_registrations_project_id_number_key
  on public.pending_volunteer_registrations (project_id, id_number)
  where id_number is not null;
