-- M2M relationships and public registration links
-- Enables volunteers/participants to link to multiple projects
-- and allows public registration via unique tokens

-- ============================================================
-- project_volunteers (M2M junction table)
-- ============================================================
create table if not exists public.project_volunteers (
  id              text primary key default gen_random_uuid()::text,
  project_id      text not null references public.projects(id) on delete cascade,
  volunteer_id    text not null references public.volunteers(id) on delete cascade,
  joined_date     date not null default now()::date,
  created_at      timestamptz not null default now(),
  unique(project_id, volunteer_id)
);

alter table public.project_volunteers enable row level security;
create policy "authenticated_full_access" on public.project_volunteers
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.project_volunteers to authenticated;

-- ============================================================
-- project_participants (M2M junction table)
-- ============================================================
create table if not exists public.project_participants (
  id              text primary key default gen_random_uuid()::text,
  project_id      text not null references public.projects(id) on delete cascade,
  participant_id  text not null references public.participants(id) on delete cascade,
  joined_date     date not null default now()::date,
  created_at      timestamptz not null default now(),
  unique(project_id, participant_id)
);

alter table public.project_participants enable row level security;
create policy "authenticated_full_access" on public.project_participants
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.project_participants to authenticated;

-- ============================================================
-- project_registration_links (permanent shareable links)
-- ============================================================
create sequence if not exists registration_link_id_seq start with 1;
create or replace function next_registration_link_id() returns text
language sql as $$
  select 'LINK-' || nextval('registration_link_id_seq')::text;
$$;

create table if not exists public.project_registration_links (
  id              text primary key default next_registration_link_id(),
  project_id      text not null references public.projects(id) on delete cascade,
  link_type       text not null check (link_type in ('volunteer', 'participant')),
  link_token      text not null,
  created_at      timestamptz not null default now(),
  unique(project_id, link_type)
);

alter table public.project_registration_links enable row level security;
create policy "authenticated_full_access" on public.project_registration_links
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.project_registration_links to authenticated;
grant usage, select on sequence registration_link_id_seq to authenticated;

-- ============================================================
-- pending_volunteer_registrations (public form submissions)
-- ============================================================
create sequence if not exists pending_volunteer_reg_id_seq start with 1;
create or replace function next_pending_volunteer_reg_id() returns text
language sql as $$
  select 'PV-' || nextval('pending_volunteer_reg_id_seq')::text;
$$;

create table if not exists public.pending_volunteer_registrations (
  id                  text primary key default next_pending_volunteer_reg_id(),
  project_id          text not null references public.projects(id) on delete cascade,
  registration_token  text not null,
  name                text not null,
  availability        text not null,
  hours               numeric not null default 0,
  status              text not null default 'פעיל' check (status in ('פעיל', 'בהפסקה', 'ארכיון')),
  skills              text[] not null default '{}',
  phone               text,
  email               text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.pending_volunteer_registrations enable row level security;

-- Allow anonymous users to INSERT (submit registrations)
create policy "public_insert" on public.pending_volunteer_registrations
  for insert to anon
  with check (true);

-- Allow authenticated users full access
create policy "authenticated_access" on public.pending_volunteer_registrations
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

grant select, insert on public.pending_volunteer_registrations to anon;
grant select, insert, update, delete on public.pending_volunteer_registrations to authenticated;
grant usage, select on sequence pending_volunteer_reg_id_seq to authenticated;

-- ============================================================
-- pending_participant_registrations (public form submissions)
-- ============================================================
create sequence if not exists pending_participant_reg_id_seq start with 1;
create or replace function next_pending_participant_reg_id() returns text
language sql as $$
  select 'PP-' || nextval('pending_participant_reg_id_seq')::text;
$$;

create table if not exists public.pending_participant_registrations (
  id                  text primary key default next_pending_participant_reg_id(),
  project_id          text not null references public.projects(id) on delete cascade,
  registration_token  text not null,
  name                text not null,
  id_number           text not null,
  phone               text not null,
  email               text,
  status              text not null default 'ממתין לאישור' check (status in ('מאושר', 'ממתין לתשלום', 'ממתין לאישור', 'טיוטה')),
  payment_status      text not null default 'לא שולם' check (payment_status in ('שולם', 'שולם חלקית', 'לא שולם', 'לא נדרש תשלום')),
  registration_date   date not null,
  documents_complete  boolean not null default false,
  is_new_immigrant    boolean not null default false,
  immigration_year    int,
  address             text,
  city                text,
  source              text not null default 'אתר' check (source in ('טופס דיגיטלי', 'QR', 'אתר', 'צוות פנימי', 'ייבוא Excel', 'API')),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.pending_participant_registrations enable row level security;

-- Allow anonymous users to INSERT (submit registrations)
create policy "public_insert" on public.pending_participant_registrations
  for insert to anon
  with check (true);

-- Allow authenticated users full access
create policy "authenticated_access" on public.pending_participant_registrations
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

grant select, insert on public.pending_participant_registrations to anon;
grant select, insert, update, delete on public.pending_participant_registrations to authenticated;
grant usage, select on sequence pending_participant_reg_id_seq to authenticated;
