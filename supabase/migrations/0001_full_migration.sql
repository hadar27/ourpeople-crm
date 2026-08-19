-- Full data migration: every remaining collection, moved from in-memory mock
-- stores (src/lib/records-store.ts, src/lib/store.ts) to real Supabase tables.
--
-- NOTE: this is the first migration file checked into the repo. The earlier
-- `suppliers` table + auth setup were applied directly via the Supabase SQL
-- editor and are NOT included here — they already exist in the project.
--
-- Run this whole script once in the Supabase SQL editor. It is organized in
-- dependency order (activities -> core entities -> already-wired CRM
-- collections -> read-only display tables) and each table's schema, RLS
-- policy, grants, and seed data are grouped together so a section can be
-- re-run independently if needed.

grant usage on schema public to authenticated;

-- ============================================================
-- activities  (from activitiesCatalog — had no id before)
-- ============================================================
create sequence if not exists activity_id_seq start with 8;
create or replace function next_activity_id() returns text
language sql as $$
  select 'ACT-' || nextval('activity_id_seq')::text;
$$;

create table if not exists public.activities (
  id    text primary key default next_activity_id(),
  name  text not null,
  type  text not null check (type in ('חינמית', 'בתשלום')),
  price numeric not null default 0
);

alter table public.activities enable row level security;
create policy "authenticated_full_access" on public.activities
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.activities to authenticated;
grant usage, select on sequence activity_id_seq to authenticated;

insert into public.activities (id, name, type, price) values
  ('ACT-1', 'קייטנת קיץ', 'בתשלום', 850),
  ('ACT-2', 'סדנת העצמה נשים', 'בתשלום', 300),
  ('ACT-3', 'ליווי משפחות', 'חינמית', 0),
  ('ACT-4', 'תכנית נוער', 'בתשלום', 200),
  ('ACT-5', 'סיוע למשפחות עולים', 'חינמית', 0),
  ('ACT-6', 'חירום ושיקום', 'חינמית', 0),
  ('ACT-7', 'מועדון נוער', 'חינמית', 0)
on conflict (id) do nothing;

-- ============================================================
-- donors
-- ============================================================
create sequence if not exists donor_id_seq start with 507;
create or replace function next_donor_id() returns text
language sql as $$
  select 'D-' || nextval('donor_id_seq')::text;
$$;

create table if not exists public.donors (
  id               text primary key default next_donor_id(),
  name             text not null,
  type             text not null check (type in ('פרטי', 'תאגיד', 'קרן')),
  total_donated    numeric not null default 0,
  last_donation    date,
  interests        text[] not null default '{}',
  status           text not null default 'פעיל' check (status in ('פעיל', 'לא פעיל')),
  contact          text,
  phone            text,
  email            text,
  address          text,
  preferred_channel text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.donors enable row level security;
create policy "authenticated_full_access" on public.donors
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.donors to authenticated;
grant usage, select on sequence donor_id_seq to authenticated;

insert into public.donors (id, name, type, total_donated, last_donation, interests, status) values
  ('D-501', 'קרן הירש לצדקה', 'קרן', 250000, '2025-04-12', ARRAY['נוער', 'חינוך'], 'פעיל'),
  ('D-502', 'חברת טכנולגיה בע״מ', 'תאגיד', 180000, '2025-03-28', ARRAY['העצמה', 'תעסוקה'], 'פעיל'),
  ('D-503', 'משפחת לוינסון', 'פרטי', 42000, '2025-05-02', ARRAY['משפחות'], 'פעיל'),
  ('D-504', 'אבי גולדמן', 'פרטי', 15000, '2024-12-15', ARRAY['חירום'], 'פעיל'),
  ('D-505', 'קרן "אור"', 'קרן', 320000, '2025-05-10', ARRAY['נשים', 'עולים'], 'פעיל'),
  ('D-506', 'מירי בלום', 'פרטי', 5400, '2024-11-04', ARRAY['נוער'], 'לא פעיל')
on conflict (id) do nothing;

-- ============================================================
-- projects
-- ============================================================
create sequence if not exists project_id_seq start with 7;
create or replace function next_project_id() returns text
language sql as $$
  select 'PR-' || lpad(nextval('project_id_seq')::text, 2, '0');
$$;

create table if not exists public.projects (
  id                  text primary key default next_project_id(),
  name                text not null,
  status              text not null default 'בתכנון' check (status in ('פעיל', 'בתכנון', 'הסתיים')),
  budget              numeric not null default 0,
  spent               numeric not null default 0,
  progress            int not null default 0,
  volunteers          int not null default 0,
  manager             text,
  description         text,
  start_date          date,
  end_date            date,
  required_volunteers int,
  suppliers           text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.projects enable row level security;
create policy "authenticated_full_access" on public.projects
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.projects to authenticated;
grant usage, select on sequence project_id_seq to authenticated;

insert into public.projects (id, name, status, budget, spent, progress, volunteers, manager) values
  ('PR-01', 'קייטנת קיץ 2025', 'פעיל', 320000, 184000, 62, 24, 'ליאת אזולאי'),
  ('PR-02', 'תכנית נוער שכונתית', 'פעיל', 180000, 92000, 48, 12, 'אורן שטרן'),
  ('PR-03', 'ליווי משפחות עולים', 'פעיל', 220000, 210000, 88, 18, 'פאדי נסר'),
  ('PR-04', 'סדנת העצמה לנשים', 'פעיל', 95000, 38000, 40, 8, 'נועה ברק'),
  ('PR-05', 'חירום ושיקום קהילתי', 'בתכנון', 410000, 12000, 5, 6, 'דניאל מזרחי'),
  ('PR-06', 'מועדונית אחה״צ', 'הסתיים', 140000, 138000, 100, 14, 'ליאת אזולאי')
on conflict (id) do nothing;

-- ============================================================
-- donations
-- donor_id: nullable FK + is_anonymous flag (DN-9007 "תורם אנונימי" has no
-- real donor row). project field is a free-text label that inconsistently
-- matches EITHER a real project name OR an activitiesCatalog name (or,
-- for DN-9006, neither) — resolved per-row below by exact string match;
-- project_label always keeps the raw original text regardless.
-- ============================================================
create sequence if not exists donation_id_seq start with 9008;
create or replace function next_donation_id() returns text
language sql as $$
  select 'DN-' || nextval('donation_id_seq')::text;
$$;

create table if not exists public.donations (
  id            text primary key default next_donation_id(),
  donor_id      text references public.donors(id),
  is_anonymous  boolean not null default false,
  amount        numeric not null,
  project_id    text references public.projects(id),
  activity_id   text references public.activities(id),
  project_label text,
  method        text not null check (method in ('העברה בנקאית', 'אשראי', 'מזומן', 'שיק')),
  receipt       text not null default 'ממתין' check (receipt in ('הופק', 'ממתין', 'חסר')),
  date          date not null,
  reference     text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (project_id is null or activity_id is null)
);

alter table public.donations enable row level security;
create policy "authenticated_full_access" on public.donations
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.donations to authenticated;
grant usage, select on sequence donation_id_seq to authenticated;

insert into public.donations (id, donor_id, is_anonymous, amount, project_id, activity_id, project_label, method, receipt, date) values
  ('DN-9001', 'D-501', false, 50000, 'PR-01', null,    'קייטנת קיץ 2025',   'העברה בנקאית', 'הופק',  '2025-05-12'),
  ('DN-9002', 'D-502', false, 80000, null,    'ACT-4', 'תכנית נוער',        'העברה בנקאית', 'הופק',  '2025-04-28'),
  ('DN-9003', 'D-503', false, 12000, null,    'ACT-3', 'ליווי משפחות',      'אשראי',        'הופק',  '2025-05-02'),
  ('DN-9004', 'D-504', false, 5000,  null,    'ACT-6', 'חירום ושיקום',      'שיק',          'ממתין', '2025-05-15'),
  ('DN-9005', 'D-505', false, 120000, null,   'ACT-2', 'סדנת העצמה נשים',   'העברה בנקאית', 'הופק',  '2025-05-10'),
  ('DN-9006', 'D-506', false, 1800,  null,    null,    'סיוע לעולים',       'אשראי',        'חסר',   '2025-05-08'),
  ('DN-9007', null,    true,  22000, 'PR-01', null,    'קייטנת קיץ 2025',   'העברה בנקאית', 'הופק',  '2025-05-18')
on conflict (id) do nothing;

-- ============================================================
-- incomes
-- ============================================================
create sequence if not exists income_id_seq start with 5;
create or replace function next_income_id() returns text
language sql as $$
  select 'IN-' || nextval('income_id_seq')::text;
$$;

create table if not exists public.incomes (
  id            text primary key default next_income_id(),
  category      text not null,
  source        text not null,
  amount        numeric not null,
  date          date not null,
  donation_id   text references public.donations(id),
  project_id    text references public.projects(id),
  project_label text,
  method        text,
  reference     text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.incomes enable row level security;
create policy "authenticated_full_access" on public.incomes
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.incomes to authenticated;
grant usage, select on sequence income_id_seq to authenticated;

-- NOTE: `incomes` ids (IN-1..IN-4) and `interactions` ids (IN-001..IN-007,
-- below) share the same visual "IN-" prefix but are two unrelated tables
-- with two different sequences/id-gen functions. Do not conflate them.
insert into public.incomes (id, category, source, amount, date, donation_id, project_id, project_label, method, reference) values
  ('IN-1', 'תרומה',          'תרומה — קרן הירש',        50000,  '2025-05-12', 'DN-9001', 'PR-01', 'קייטנת קיץ 2025',   'העברה בנקאית', 'REF-10021'),
  ('IN-2', 'תרומה',          'תרומה — חברת טכנולגיה',    80000,  '2025-04-28', 'DN-9002', null,    'תכנית נוער',        'העברה בנקאית', 'REF-10022'),
  ('IN-3', 'תרומה',          'תרומה — קרן "אור"',       120000, '2025-05-10', 'DN-9005', 'PR-04', 'סדנת העצמה לנשים',  'העברה בנקאית', 'REF-10023'),
  ('IN-4', 'אגרות נרשמים',   'אגרות נרשמים',             24800,  '2025-05-18', null,      null,    'כללי',              'אשראי',        'REF-10024')
on conflict (id) do nothing;

-- ============================================================
-- expenses
-- ============================================================
create sequence if not exists expense_id_seq start with 6;
create or replace function next_expense_id() returns text
language sql as $$
  select 'EX-' || nextval('expense_id_seq')::text;
$$;

create table if not exists public.expenses (
  id             text primary key default next_expense_id(),
  category       text not null,
  amount         numeric not null,
  date           date not null,
  supplier_id    text references public.suppliers(id),
  project_id     text references public.projects(id),
  project_label  text,
  status         text not null,
  receipt_status text,
  reference      text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.expenses enable row level security;
create policy "authenticated_full_access" on public.expenses
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.expenses to authenticated;
grant usage, select on sequence expense_id_seq to authenticated;

insert into public.expenses (id, category, amount, date, supplier_id, project_id, project_label, status, receipt_status, reference) values
  ('EX-1', 'שכר ותפעול',   84200, '2025-05-10', null,    null,    'כללי',            'שולם',  'חשבונית התקבלה', 'INV-4410'),
  ('EX-2', 'הסעות',        12300, '2025-05-12', 'S-301', 'PR-01', 'קייטנת קיץ 2025', 'שולם',  'חשבונית התקבלה', 'INV-4411'),
  ('EX-3', 'קייטרינג',     18900, '2025-05-14', 'S-302', 'PR-04', 'סדנת העצמה לנשים','ממתין', 'חסרה חשבונית',   'INV-4412'),
  ('EX-4', 'ערכות חירום',  32400, '2025-05-15', null,    null,    'חירום ושיקום',    'שולם',  'חשבונית התקבלה', 'INV-4413'),
  ('EX-5', 'פרסום ושיווק', 6700,  '2025-05-16', null,    null,    'כללי',            'ממתין', 'חסרה חשבונית',   'INV-4414')
on conflict (id) do nothing;

-- ============================================================
-- participants
-- ============================================================
create sequence if not exists participant_id_seq start with 1010;
create or replace function next_participant_id() returns text
language sql as $$
  select 'P-' || nextval('participant_id_seq')::text;
$$;

create table if not exists public.participants (
  id                 text primary key default next_participant_id(),
  name               text not null,
  id_number          text not null,
  phone              text not null,
  activity_id        text not null references public.activities(id),
  activity_type      text not null check (activity_type in ('חינמית', 'בתשלום')),
  status             text not null check (status in ('מאושר', 'ממתין לתשלום', 'ממתין לאישור', 'טיוטה')),
  payment_status     text not null check (payment_status in ('שולם', 'שולם חלקית', 'לא שולם', 'לא נדרש תשלום')),
  source             text not null check (source in ('טופס דיגיטלי', 'QR', 'אתר', 'צוות פנימי', 'ייבוא Excel', 'API')),
  registration_date  date not null,
  documents_complete boolean not null default false,
  is_new_immigrant   boolean not null default false,
  immigration_year   int,
  email              text,
  address            text,
  city               text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.participants enable row level security;
create policy "authenticated_full_access" on public.participants
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.participants to authenticated;
grant usage, select on sequence participant_id_seq to authenticated;

insert into public.participants (id, name, id_number, phone, activity_id, activity_type, status, payment_status, source, registration_date, documents_complete, is_new_immigrant, immigration_year) values
  ('P-1001', 'מירב כהן',       '302145678', '0501234567', 'ACT-1', 'בתשלום', 'מאושר',        'שולם',              'טופס דיגיטלי', '2025-05-12', true,  false, null),
  ('P-1002', 'אחמד עבדאללה',   '315678234', '0527788991', 'ACT-2', 'בתשלום', 'ממתין לתשלום', 'שולם חלקית',        'QR',            '2025-05-18', true,  false, null),
  ('P-1003', 'נטלי לוי',       '208934512', '0541239876', 'ACT-3', 'חינמית', 'ממתין לאישור', 'לא נדרש תשלום',     'אתר',           '2025-05-20', false, false, null),
  ('P-1004', 'יוסי בן דוד',    '311223344', '0509988776', 'ACT-4', 'בתשלום', 'מאושר',        'שולם',              'צוות פנימי',    '2025-04-30', true,  false, null),
  ('P-1005', 'סוזן מרים',      '327654321', '0533344556', 'ACT-5', 'חינמית', 'ממתין לאישור', 'לא נדרש תשלום',     'ייבוא Excel',   '2025-05-05', false, true,  2022),
  ('P-1006', 'דנה אברמוב',     '318877665', '0521122334', 'ACT-1', 'בתשלום', 'מאושר',        'שולם',              'טופס דיגיטלי', '2025-05-15', true,  true,  2018),
  ('P-1007', 'מוחמד חליל',     '330011223', '0544455667', 'ACT-6', 'חינמית', 'מאושר',        'לא נדרש תשלום',     'API',           '2025-05-21', true,  false, null),
  ('P-1008', 'רחל פרידמן',     '298877665', '0507788990', 'ACT-4', 'בתשלום', 'ממתין לתשלום', 'לא שולם',           'טופס דיגיטלי', '2025-05-22', false, false, null),
  ('P-1009', 'אלינור בקר',     '320099887', '0508877665', 'ACT-1', 'בתשלום', 'מאושר',        'שולם',              'QR',            '2025-05-23', true,  true,  2023)
on conflict (id) do nothing;

-- ============================================================
-- volunteers
-- Volunteer.project matches activitiesCatalog.name in 5/6 rows (V-206
-- "סיוע לעולים" doesn't exactly match "סיוע למשפחות עולים" — left null,
-- raw label preserved in project_label).
-- ============================================================
create sequence if not exists volunteer_id_seq start with 207;
create or replace function next_volunteer_id() returns text
language sql as $$
  select 'V-' || nextval('volunteer_id_seq')::text;
$$;

create table if not exists public.volunteers (
  id            text primary key default next_volunteer_id(),
  name          text not null,
  availability  text not null,
  activity_id   text references public.activities(id),
  project_label text,
  hours         numeric not null default 0,
  status        text not null default 'פעיל' check (status in ('פעיל', 'בהפסקה', 'ארכיון')),
  skills        text[] not null default '{}',
  phone         text,
  email         text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.volunteers enable row level security;
create policy "authenticated_full_access" on public.volunteers
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.volunteers to authenticated;
grant usage, select on sequence volunteer_id_seq to authenticated;

insert into public.volunteers (id, name, availability, activity_id, project_label, hours, status, skills) values
  ('V-201', 'אורן שטרן',   'ערבים + סופ״ש', 'ACT-1', 'קייטנת קיץ',       124, 'פעיל',   ARRAY['הדרכה', 'עברית', 'ספורט']),
  ('V-202', 'ליאת אזולאי', 'ימים א׳–ה׳',    'ACT-3', 'ליווי משפחות',     86,  'פעיל',   ARRAY['עו״ס', 'ערבית']),
  ('V-203', 'דניאל מזרחי', 'סופי שבוע',      'ACT-6', 'חירום ושיקום',     42,  'פעיל',   ARRAY['נהיגה', 'לוגיסטיקה']),
  ('V-204', 'נועה ברק',    'בקרים',          'ACT-2', 'סדנת העצמה נשים',  67,  'פעיל',   ARRAY['פסיכולוגיה', 'אנגלית']),
  ('V-205', 'תומר רז',     'גמיש',           'ACT-4', 'תכנית נוער',       15,  'בהפסקה', ARRAY['מוזיקה']),
  ('V-206', 'פאדי נסר',    'ערבים',          null,    'סיוע לעולים',      92,  'פעיל',   ARRAY['תרגום', 'ערבית', 'רוסית'])
on conflict (id) do nothing;

-- ============================================================
-- users (plain staff directory — NOT wired to auth.users; the app is a
-- browser-only client with just a publishable key, so it cannot manage
-- real Supabase Auth users)
-- ============================================================
create sequence if not exists app_user_id_seq start with 7;
create or replace function next_app_user_id() returns text
language sql as $$
  select 'U-' || nextval('app_user_id_seq')::text;
$$;

create table if not exists public.users (
  id          text primary key default next_app_user_id(),
  name        text not null,
  email       text not null unique,
  role        text not null check (role in ('מנהל מערכת', 'הנהלה', 'מנהל כספים', 'מנהל מתנדבים', 'מנהל קשרי תורמים')),
  status      text not null default 'פעיל' check (status in ('פעיל', 'מושעה')),
  last_login  date,
  permissions text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.users enable row level security;
create policy "authenticated_full_access" on public.users
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.users to authenticated;
grant usage, select on sequence app_user_id_seq to authenticated;

insert into public.users (id, name, email, role, status, last_login) values
  ('U-1', 'שרה כהן',    'sarah@ourpeople.org', 'מנהל מערכת',       'פעיל',  '2025-05-20'),
  ('U-2', 'דוד לוי',    'david@ourpeople.org', 'הנהלה',            'פעיל',  '2025-05-19'),
  ('U-3', 'רונית פרץ',  'ronit@ourpeople.org', 'מנהל כספים',       'פעיל',  '2025-05-20'),
  ('U-4', 'אורן שטרן',  'oren@ourpeople.org',  'מנהל מתנדבים',     'פעיל',  '2025-05-18'),
  ('U-5', 'מאיה גרין',  'maya@ourpeople.org',  'מנהל קשרי תורמים', 'פעיל',  '2025-05-17'),
  ('U-6', 'יואב סבן',   'yoav@ourpeople.org',  'הנהלה',            'מושעה', '2025-04-30')
on conflict (id) do nothing;

-- ============================================================
-- families
-- ============================================================
create sequence if not exists family_id_seq start with 108;
create or replace function next_family_id() returns text
language sql as $$
  select 'F-' || nextval('family_id_seq')::text;
$$;

create table if not exists public.families (
  id                 text primary key default next_family_id(),
  family_name        text not null,
  main_contact       text not null,
  phone              text not null,
  email              text,
  city               text not null,
  country_of_origin  text not null,
  immigration_date   date not null,
  members_count      int not null default 1,
  needs              text[] not null default '{}',
  status             text not null check (status in ('בטיפול פעיל', 'ממתינה לאישור', 'מלווה', 'סגורה', 'בסיכון')),
  assigned_staff     text not null,
  project_id         text references public.projects(id),
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.families enable row level security;
create policy "authenticated_full_access" on public.families
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.families to authenticated;
grant usage, select on sequence family_id_seq to authenticated;

insert into public.families (id, family_name, main_contact, phone, email, city, country_of_origin, immigration_date, members_count, needs, status, assigned_staff, project_id, notes) values
  ('F-101', 'משפחת אברמוב',   'דנה אברמוב',   '0521122334', 'abramov@example.com', 'אשדוד',      'אוקראינה', '2018-06-14', 5, ARRAY['עברית', 'תעסוקה', 'חינוך'], 'בטיפול פעיל',   'פאדי נסר',    'PR-03', 'שני ילדים בגיל בית ספר, האם מחפשת עבודה בתחום ההנדסה.'),
  ('F-102', 'משפחת מרים',     'סוזן מרים',    '0533344556', null,                  'נתניה',      'אתיופיה',  '2022-03-02', 6, ARRAY['דיור', 'מזון', 'עברית'],     'בסיכון',        'ליאת אזולאי', 'PR-03', 'קושי בתשלומי שכירות, נדרש ליווי צמוד.'),
  ('F-103', 'משפחת בקר',      'אלינור בקר',   '0508877665', 'becker@example.com', 'חיפה',       'רוסיה',    '2023-09-21', 3, ARRAY['עברית', 'חינוך'],            'מלווה',         'נועה ברק',    'PR-01', null),
  ('F-104', 'משפחת חליל',     'מוחמד חליל',   '0544455667', null,                  'לוד',        'ישראל',    '1990-01-01', 7, ARRAY['מזון', 'ריהוט', 'בריאות'],   'בטיפול פעיל',   'דניאל מזרחי', 'PR-05', null),
  ('F-105', 'משפחת לוי-אשד',  'נטלי לוי',     '0541239876', null,                  'ירושלים',    'צרפת',     '2016-08-30', 4, ARRAY['תעסוקה', 'משפטי'],           'ממתינה לאישור', 'פאדי נסר',    null,    null),
  ('F-106', 'משפחת עבדאללה',  'אחמד עבדאללה', '0527788991', null,                  'רמלה',       'ישראל',    '1985-01-01', 5, ARRAY['חינוך', 'תעסוקה'],           'מלווה',         'ליאת אזולאי', 'PR-02', null),
  ('F-107', 'משפחת פרידמן',   'רחל פרידמן',   '0507788990', null,                  'בת ים',      'ארגנטינה', '2011-11-11', 2, ARRAY['בריאות', 'מזון'],            'סגורה',         'נועה ברק',    null,    null)
on conflict (id) do nothing;

-- ============================================================
-- family_members
-- ============================================================
create sequence if not exists family_member_id_seq start with 19;
create or replace function next_family_member_id() returns text
language sql as $$
  select 'FM-' || lpad(nextval('family_member_id_seq')::text, 2, '0');
$$;

create table if not exists public.family_members (
  id         text primary key default next_family_member_id(),
  family_id  text not null references public.families(id),
  name       text not null,
  relation   text not null check (relation in ('ראש משפחה', 'בן/בת זוג', 'ילד/ה', 'הורה', 'אחר')),
  birth_year int not null,
  status     text not null check (status in ('מבוגר', 'קטין', 'סטודנט', 'גמלאי')),
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.family_members enable row level security;
create policy "authenticated_full_access" on public.family_members
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.family_members to authenticated;
grant usage, select on sequence family_member_id_seq to authenticated;

insert into public.family_members (id, family_id, name, relation, birth_year, status, notes) values
  ('FM-01', 'F-101', 'דנה אברמוב',    'ראש משפחה', 1984, 'מבוגר',  'מהנדסת אזרחית, לומדת עברית ברמה ג׳'),
  ('FM-02', 'F-101', 'איגור אברמוב',  'בן/בת זוג', 1981, 'מבוגר',  'עובד בתחום הריתוך'),
  ('FM-03', 'F-101', 'מריה אברמוב',   'ילד/ה',     2011, 'קטין',   null),
  ('FM-04', 'F-101', 'ניקיטה אברמוב', 'ילד/ה',     2014, 'קטין',   null),
  ('FM-05', 'F-101', 'גלינה אברמוב',  'הורה',      1955, 'גמלאי',  null),
  ('FM-06', 'F-102', 'סוזן מרים',     'ראש משפחה', 1979, 'מבוגר',  null),
  ('FM-07', 'F-102', 'טסאיי מרים',    'בן/בת זוג', 1976, 'מבוגר',  null),
  ('FM-08', 'F-102', 'אביבה מרים',    'ילד/ה',     2008, 'קטין',   null),
  ('FM-09', 'F-102', 'יונתן מרים',    'ילד/ה',     2012, 'קטין',   null),
  ('FM-10', 'F-103', 'אלינור בקר',    'ראש משפחה', 1990, 'מבוגר',  null),
  ('FM-11', 'F-103', 'לב בקר',        'ילד/ה',     2015, 'קטין',   null),
  ('FM-12', 'F-103', 'סופיה בקר',     'ילד/ה',     2019, 'קטין',   null),
  ('FM-13', 'F-104', 'מוחמד חליל',    'ראש משפחה', 1972, 'מבוגר',  null),
  ('FM-14', 'F-104', 'פאטמה חליל',    'בן/בת זוג', 1975, 'מבוגר',  null),
  ('FM-15', 'F-104', 'עלי חליל',      'ילד/ה',     2005, 'סטודנט', null),
  ('FM-16', 'F-105', 'נטלי לוי',      'ראש משפחה', 1988, 'מבוגר',  null),
  ('FM-17', 'F-106', 'אחמד עבדאללה',  'ראש משפחה', 1983, 'מבוגר',  null),
  ('FM-18', 'F-107', 'רחל פרידמן',    'ראש משפחה', 1958, 'גמלאי',  null)
on conflict (id) do nothing;

-- ============================================================
-- assistance
-- ============================================================
create sequence if not exists assistance_id_seq start with 14;
create or replace function next_assistance_id() returns text
language sql as $$
  select 'AS-' || lpad(nextval('assistance_id_seq')::text, 2, '0');
$$;

create table if not exists public.assistance (
  id          text primary key default next_assistance_id(),
  family_id   text not null references public.families(id),
  type        text not null check (type in ('מזון', 'דיור', 'תעסוקה', 'חינוך', 'בריאות', 'משפטי', 'ריהוט', 'עברית')),
  description text not null,
  amount      numeric,
  date        date not null,
  project_id  text references public.projects(id),
  staff       text not null,
  status      text not null check (status in ('אושר', 'ממתין', 'סופק', 'נדחה')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.assistance enable row level security;
create policy "authenticated_full_access" on public.assistance
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.assistance to authenticated;
grant usage, select on sequence assistance_id_seq to authenticated;

insert into public.assistance (id, family_id, type, description, amount, date, project_id, staff, status) values
  ('AS-01', 'F-101', 'עברית',   'שיבוץ לאולפן ערב + חונכות אישית',                    null, '2025-02-20', 'PR-03', 'פאדי נסר',    'סופק'),
  ('AS-02', 'F-101', 'תעסוקה',  'ליווי תעסוקתי — כתיבת קו״ח והכנה לראיונות',          null, '2025-03-15', 'PR-03', 'נועה ברק',    'סופק'),
  ('AS-03', 'F-101', 'חינוך',   'מלגת חוגים לשני ילדים',                              2400, '2025-04-10', 'PR-03', 'פאדי נסר',    'אושר'),
  ('AS-04', 'F-102', 'דיור',    'סיוע בתשלום שכירות — 3 חודשים',                      9000, '2025-03-01', 'PR-03', 'ליאת אזולאי', 'סופק'),
  ('AS-05', 'F-102', 'מזון',    'סל מזון חודשי',                                      650,  '2025-05-01', 'PR-03', 'ליאת אזולאי', 'סופק'),
  ('AS-06', 'F-102', 'דיור',    'בקשה להארכת סיוע בשכירות',                           9000, '2025-05-18', 'PR-03', 'ליאת אזולאי', 'ממתין'),
  ('AS-07', 'F-103', 'חינוך',   'קייטנת קיץ לשני ילדים',                              1700, '2025-05-15', 'PR-01', 'נועה ברק',    'אושר'),
  ('AS-08', 'F-104', 'מזון',    'שוברי מזון חירום',                                   1200, '2025-05-10', 'PR-05', 'דניאל מזרחי', 'סופק'),
  ('AS-09', 'F-104', 'ריהוט',   'מיטות ומזרנים לשלושה ילדים',                         3800, '2025-05-12', 'PR-05', 'דניאל מזרחי', 'ממתין'),
  ('AS-10', 'F-104', 'בריאות',  'השתתפות בטיפול שיניים',                              2200, '2025-04-22', null,    'דניאל מזרחי', 'סופק'),
  ('AS-11', 'F-105', 'משפטי',   'ייעוץ משפטי בנושא הכרה בתעודות מקצועיות',            null, '2025-05-20', null,    'פאדי נסר',    'ממתין'),
  ('AS-12', 'F-106', 'חינוך',   'שיעורי עזר לשני ילדים',                              1500, '2025-04-05', 'PR-02', 'ליאת אזולאי', 'סופק'),
  ('AS-13', 'F-107', 'בריאות',  'ליווי רפואי — סיום טיפול',                           null, '2025-02-28', null,    'נועה ברק',    'סופק')
on conflict (id) do nothing;

-- ============================================================
-- interactions
-- NOTE: shares the visual "IN-" prefix with `incomes` above — different
-- table, different sequence/id-gen function, not related.
-- ============================================================
create sequence if not exists interaction_id_seq start with 8;
create or replace function next_interaction_id() returns text
language sql as $$
  select 'IN-' || lpad(nextval('interaction_id_seq')::text, 3, '0');
$$;

create table if not exists public.interactions (
  id               text primary key default next_interaction_id(),
  donor_id         text not null references public.donors(id),
  type             text not null check (type in ('שיחת טלפון', 'פגישה', 'דוא"ל', 'WhatsApp', 'אחר')),
  date             date not null,
  time             text not null,
  staff            text not null,
  subject          text not null,
  summary          text not null,
  outcome          text not null,
  follow_up_action text,
  follow_up_date   date,
  status           text not null check (status in ('פתוח', 'ממתין', 'הושלם')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.interactions enable row level security;
create policy "authenticated_full_access" on public.interactions
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.interactions to authenticated;
grant usage, select on sequence interaction_id_seq to authenticated;

insert into public.interactions (id, donor_id, type, date, time, staff, subject, summary, outcome, follow_up_action, follow_up_date, status) values
  ('IN-001', 'D-501', 'פגישה',       '2025-05-04', '10:30', 'מאיה גרין', 'פגישת חידוש מענק שנתי',
    'נפגשנו במשרדי הקרן. הוצגה תכנית קייטנת קיץ 2025 ותקציב מפורט. הקרן הביעה עניין להגדיל את התמיכה ב-15%.',
    'הקרן מבקשת דוח השפעה מרבעון קודם לפני אישור סופי.', 'שליחת דוח השפעה Q1 + טיוטת הסכם מענק', '2025-05-15', 'פתוח'),
  ('IN-002', 'D-501', 'שיחת טלפון',  '2025-04-12', '14:00', 'מאיה גרין', 'אישור העברה בנקאית',
    'שיחה קצרה לאימות פרטי חשבון להעברת המענק הרבעוני.',
    'ההעברה בוצעה, קבלה הופקה.', null, null, 'הושלם'),
  ('IN-003', 'D-502', 'דוא"ל',       '2025-05-11', '09:15', 'דוד לוי',   'שיתוף פעולה בהתנדבות עובדים',
    'החברה מציעה יום התנדבות עובדים בתכנית הנוער השכונתית, כ-40 עובדים.',
    'נדרש תיאום לוגיסטי מול רכז המתנדבים.', 'תיאום מועד יום התנדבות עם אורן שטרן', '2025-05-20', 'ממתין'),
  ('IN-004', 'D-503', 'שיחת טלפון',  '2025-05-02', '16:45', 'מאיה גרין', 'תודה על תרומה חודשית',
    'שיחת תודה אישית על התרומה החודשית לליווי משפחות.',
    'המשפחה מעוניינת לקבל עדכון תמונות מהשטח.', 'שליחת ניוזלטר חודשי עם תמונות', '2025-06-01', 'פתוח'),
  ('IN-005', 'D-505', 'פגישה',       '2025-05-10', '11:00', 'שרה כהן',   'סיור בסדנת העצמה לנשים',
    'נציגות הקרן ביקרו בסדנה, שוחחו עם משתתפות ועם המנחה נועה ברק.',
    'הקרן אישרה מענק המשך של ₪120,000.', null, null, 'הושלם'),
  ('IN-006', 'D-506', 'WhatsApp',    '2024-11-04', '19:20', 'מאיה גרין', 'בדיקת שביעות רצון',
    'פנייה לבדיקת שביעות רצון לאחר תרומה חד-פעמית.',
    'לא התקבלה תשובה. התורמת סומנה כלא פעילה.', 'ניסיון חידוש קשר לקראת קמפיין סוף שנה', '2025-05-01', 'פתוח'),
  ('IN-007', 'D-504', 'שיחת טלפון',  '2025-05-15', '13:10', 'דוד לוי',   'תרומה ייעודית לחירום',
    'התורם הודיע על שיק בסך ₪5,000 לפרויקט חירום ושיקום.',
    'השיק התקבל, ממתין להפקת קבלה.', 'הפקת קבלה ושליחתה בדואר', '2025-05-22', 'ממתין')
on conflict (id) do nothing;

-- ============================================================
-- follow_ups
-- entity_type/entity_id is a polymorphic reference (donor/supplier/family)
-- — kept as plain columns with an enum check, no hard FK (same convention
-- used for documents/activity_log below).
-- ============================================================
create sequence if not exists follow_up_id_seq start with 5;
create or replace function next_follow_up_id() returns text
language sql as $$
  select 'FU-' || lpad(nextval('follow_up_id_seq')::text, 2, '0');
$$;

create table if not exists public.follow_ups (
  id                     text primary key default next_follow_up_id(),
  entity_type            text not null check (entity_type in ('donor', 'supplier', 'family')),
  entity_id              text not null,
  entity_name            text not null,
  source_interaction_id  text references public.interactions(id),
  title                  text not null,
  due_date               date not null,
  assignee               text not null,
  status                 text not null check (status in ('פתוח', 'ממתין', 'הושלם')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.follow_ups enable row level security;
create policy "authenticated_full_access" on public.follow_ups
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.follow_ups to authenticated;
grant usage, select on sequence follow_up_id_seq to authenticated;

insert into public.follow_ups (id, entity_type, entity_id, entity_name, title, due_date, assignee, status) values
  ('FU-01', 'family',   'F-102', 'משפחת מרים',   'ביקור בית ובדיקת מצב שכירות',           '2025-05-16', 'ליאת אזולאי', 'פתוח'),
  ('FU-02', 'family',   'F-104', 'משפחת חליל',   'אישור בקשת ריהוט מול ועדת סיוע',        '2025-05-28', 'דניאל מזרחי', 'ממתין'),
  ('FU-03', 'supplier', 'S-303', 'אבי ציוד משרדי','בירור חשבונית INV-3005 באיחור',        '2025-05-10', 'רונית פרץ',   'פתוח'),
  ('FU-04', 'supplier', 'S-305', 'דפוס "טופ"',   'החלטה על חידוש התקשרות',                '2025-06-05', 'שרה כהן',     'ממתין')
on conflict (id) do nothing;

-- ============================================================
-- allocations (donation <-> project junction; only hard-delete path
-- in the app, via removeAllocation)
-- ============================================================
create sequence if not exists allocation_id_seq start with 7;
create or replace function next_allocation_id() returns text
language sql as $$
  select 'AL-' || lpad(nextval('allocation_id_seq')::text, 2, '0');
$$;

create table if not exists public.allocations (
  id          text primary key default next_allocation_id(),
  donation_id text not null references public.donations(id),
  project_id  text not null references public.projects(id),
  amount      numeric not null,
  date        date not null,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table public.allocations enable row level security;
create policy "authenticated_full_access" on public.allocations
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.allocations to authenticated;
grant usage, select on sequence allocation_id_seq to authenticated;

insert into public.allocations (id, donation_id, project_id, amount, date, notes) values
  ('AL-01', 'DN-9001', 'PR-01', 50000, '2025-05-12', 'ייעוד מלא לקייטנת קיץ'),
  ('AL-02', 'DN-9002', 'PR-02', 60000, '2025-04-28', 'מחזור הדרכות'),
  ('AL-03', 'DN-9002', 'PR-04', 20000, '2025-04-29', 'העברה לסדנת נשים בהסכמת התורם'),
  ('AL-04', 'DN-9003', 'PR-03', 12000, '2025-05-02', null),
  ('AL-05', 'DN-9005', 'PR-04', 75000, '2025-05-10', 'מענק ליבה'),
  ('AL-06', 'DN-9007', 'PR-01', 22000, '2025-05-18', null)
on conflict (id) do nothing;

-- ============================================================
-- READ-ONLY DISPLAY TABLES
-- No id-gen function/sequence — the app has no insert path for these
-- (per decision: migrate data + swap reads only, no new create/edit UI).
-- Seed rows use their existing literal ids.
-- ============================================================

-- ---------- contracts ----------
create table if not exists public.contracts (
  id         text primary key,
  supplier_id text not null references public.suppliers(id),
  title      text not null,
  project_id text references public.projects(id),
  value      numeric not null,
  start_date date not null,
  end_date   date not null,
  status     text not null check (status in ('בתוקף', 'הסתיים', 'בטיוטה'))
);

alter table public.contracts enable row level security;
create policy "authenticated_full_access" on public.contracts
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.contracts to authenticated;

insert into public.contracts (id, supplier_id, title, project_id, value, start_date, end_date, status) values
  ('C-1001', 'S-301', 'הסעות קייטנת קיץ 2025',        'PR-01', 90000,  '2025-04-01', '2025-09-01', 'בתוקף'),
  ('C-1002', 'S-301', 'הסעות ליווי משפחות',            'PR-03', 42000,  '2025-01-15', '2025-12-31', 'בתוקף'),
  ('C-1003', 'S-301', 'הסעות מועדונית',                'PR-06', 28000,  '2024-09-01', '2025-04-15', 'הסתיים'),
  ('C-1004', 'S-302', 'קייטרינג יומי קייטנה',          'PR-01', 120000, '2025-05-01', '2025-08-31', 'בתוקף'),
  ('C-1005', 'S-302', 'כיבוד סדנאות',                  'PR-04', 14000,  '2025-03-01', '2025-07-31', 'בתוקף'),
  ('C-1006', 'S-303', 'אספקת ציוד משרדי ופעילות',      null,    60000,  '2025-01-01', '2025-12-31', 'בתוקף'),
  ('C-1007', 'S-304', 'מערך הדרכות ותוכן',             'PR-02', 85000,  '2025-02-01', '2025-11-30', 'בתוקף'),
  ('C-1008', 'S-304', 'ליווי מקצועי למשפחות',          'PR-03', 56000,  '2025-03-01', '2025-10-31', 'בתוקף'),
  ('C-1009', 'S-305', 'דפוס חומרי שיווק',              null,    18000,  '2025-01-01', '2025-06-30', 'בטיוטה')
on conflict (id) do nothing;

-- ---------- purchase_orders ----------
create table if not exists public.purchase_orders (
  id          text primary key,
  supplier_id text not null references public.suppliers(id),
  project_id  text references public.projects(id),
  description text not null,
  amount      numeric not null,
  date        date not null,
  status      text not null check (status in ('מאושרת', 'ממתין', 'בוטלה'))
);

alter table public.purchase_orders enable row level security;
create policy "authenticated_full_access" on public.purchase_orders
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.purchase_orders to authenticated;

insert into public.purchase_orders (id, supplier_id, project_id, description, amount, date, status) values
  ('PO-2001', 'S-301', 'PR-01', 'הסעות מאי — 12 נסיעות',          25000, '2025-05-01', 'מאושרת'),
  ('PO-2002', 'S-301', 'PR-03', 'הסעות ליווי משפחות מאי',          18000, '2025-05-08', 'ממתין'),
  ('PO-2003', 'S-302', 'PR-01', 'ארוחות צהריים — שבוע 1-2',        42000, '2025-05-05', 'מאושרת'),
  ('PO-2004', 'S-303', 'PR-01', 'ציוד פעילות וכלי יצירה',          12000, '2025-04-28', 'מאושרת'),
  ('PO-2005', 'S-303', 'PR-02', 'ציוד למועדון נוער',               9500,  '2025-04-18', 'מאושרת'),
  ('PO-2006', 'S-304', 'PR-02', 'מחזור הדרכות אפריל-מאי',          32000, '2025-04-25', 'מאושרת'),
  ('PO-2007', 'S-305', null,    'הדפסת 5,000 עלונים',              8500,  '2025-05-14', 'ממתין')
on conflict (id) do nothing;

-- ---------- supplier_invoices ----------
create table if not exists public.supplier_invoices (
  id          text primary key,
  supplier_id text not null references public.suppliers(id),
  project_id  text references public.projects(id),
  po_id       text references public.purchase_orders(id),
  amount      numeric not null,
  issue_date  date not null,
  due_date    date not null,
  status      text not null check (status in ('שולם', 'ממתין', 'חלקי', 'באיחור'))
);

alter table public.supplier_invoices enable row level security;
create policy "authenticated_full_access" on public.supplier_invoices
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.supplier_invoices to authenticated;

insert into public.supplier_invoices (id, supplier_id, project_id, po_id, amount, issue_date, due_date, status) values
  ('INV-3001', 'S-301', 'PR-01', 'PO-2001', 25000, '2025-05-04', '2025-06-03', 'שולם'),
  ('INV-3002', 'S-301', 'PR-03', 'PO-2002', 18000, '2025-04-12', '2025-05-12', 'באיחור'),
  ('INV-3003', 'S-302', 'PR-01', 'PO-2003', 42000, '2025-05-10', '2025-06-09', 'שולם'),
  ('INV-3004', 'S-302', 'PR-04', null,      6500,  '2025-05-08', '2025-06-07', 'שולם'),
  ('INV-3005', 'S-303', 'PR-01', 'PO-2004', 12000, '2025-04-02', '2025-05-02', 'באיחור'),
  ('INV-3006', 'S-303', 'PR-02', 'PO-2005', 9500,  '2025-05-12', '2025-06-11', 'ממתין'),
  ('INV-3007', 'S-304', 'PR-02', 'PO-2006', 32000, '2025-05-02', '2025-06-01', 'שולם'),
  ('INV-3008', 'S-304', 'PR-03', null,      28000, '2025-05-05', '2025-06-04', 'שולם'),
  ('INV-3009', 'S-305', null,    null,      8500,  '2025-03-18', '2025-04-17', 'חלקי')
on conflict (id) do nothing;

-- ---------- supplier_payments ----------
-- No 1:1 assumption with invoices — PM-4006 is a partial payment.
create table if not exists public.supplier_payments (
  id          text primary key,
  supplier_id text not null references public.suppliers(id),
  invoice_id  text not null references public.supplier_invoices(id),
  amount      numeric not null,
  date        date not null,
  method      text not null check (method in ('העברה בנקאית', 'שיק', 'אשראי'))
);

alter table public.supplier_payments enable row level security;
create policy "authenticated_full_access" on public.supplier_payments
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.supplier_payments to authenticated;

insert into public.supplier_payments (id, supplier_id, invoice_id, amount, date, method) values
  ('PM-4001', 'S-301', 'INV-3001', 25000, '2025-05-20', 'העברה בנקאית'),
  ('PM-4002', 'S-302', 'INV-3003', 42000, '2025-05-18', 'העברה בנקאית'),
  ('PM-4003', 'S-302', 'INV-3004', 6500,  '2025-05-16', 'אשראי'),
  ('PM-4004', 'S-304', 'INV-3007', 32000, '2025-05-14', 'העברה בנקאית'),
  ('PM-4005', 'S-304', 'INV-3008', 28000, '2025-05-19', 'העברה בנקאית'),
  ('PM-4006', 'S-305', 'INV-3009', 4000,  '2025-04-20', 'שיק')
on conflict (id) do nothing;

-- ---------- documents ----------
-- entity_type/entity_id polymorphic (supplier/family/donor), no hard FK.
create table if not exists public.documents (
  id          text primary key,
  entity_type text not null check (entity_type in ('supplier', 'family', 'donor')),
  entity_id   text not null,
  name        text not null,
  kind        text not null,
  uploaded_at date not null,
  uploaded_by text not null
);

alter table public.documents enable row level security;
create policy "authenticated_full_access" on public.documents
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.documents to authenticated;

insert into public.documents (id, entity_type, entity_id, name, kind, uploaded_at, uploaded_by) values
  ('DOC-01', 'supplier', 'S-301', 'הסכם הסעות 2025.pdf',           'חוזה',       '2025-04-01', 'רונית פרץ'),
  ('DOC-02', 'supplier', 'S-301', 'אישור ניכוי מס במקור.pdf',      'אישור מס',   '2025-01-08', 'רונית פרץ'),
  ('DOC-03', 'supplier', 'S-301', 'ביטוח צד ג׳.pdf',               'ביטוח',      '2025-02-11', 'שרה כהן'),
  ('DOC-04', 'supplier', 'S-302', 'רישיון עסק — קייטרינג.pdf',     'רישיון',     '2025-01-20', 'רונית פרץ'),
  ('DOC-05', 'supplier', 'S-302', 'תעודת כשרות.pdf',               'אישור',      '2025-01-20', 'רונית פרץ'),
  ('DOC-06', 'supplier', 'S-303', 'הצעת מחיר ציוד Q2.pdf',         'הצעת מחיר',  '2025-04-01', 'דוד לוי'),
  ('DOC-07', 'supplier', 'S-304', 'הסכם מסגרת תוכן.pdf',           'חוזה',       '2025-02-01', 'שרה כהן'),
  ('DOC-08', 'supplier', 'S-305', 'אישור ניהול ספרים.pdf',         'אישור מס',   '2024-12-30', 'רונית פרץ'),
  ('DOC-09', 'family',   'F-101', 'תעודת עולה.pdf',                'מסמך זהות',  '2025-02-14', 'פאדי נסר'),
  ('DOC-10', 'family',   'F-101', 'אישור הכנסות.pdf',              'כלכלי',      '2025-03-02', 'פאדי נסר'),
  ('DOC-11', 'family',   'F-102', 'חוזה שכירות.pdf',               'דיור',       '2025-01-25', 'ליאת אזולאי')
on conflict (id) do nothing;

-- ---------- activity_log ----------
-- Named activity_log (not "activity") to avoid ambiguity with the new
-- `activities` catalog table above. entity_type/entity_id polymorphic,
-- no hard FK. Note: the app's logActivity() has zero call sites — this
-- table is seed-only, nothing writes to it today.
create table if not exists public.activity_log (
  id          text primary key,
  entity_type text not null check (entity_type in ('supplier', 'family', 'donor')),
  entity_id   text not null,
  date        date not null,
  actor       text not null,
  action      text not null,
  detail      text
);

alter table public.activity_log enable row level security;
create policy "authenticated_full_access" on public.activity_log
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.activity_log to authenticated;

insert into public.activity_log (id, entity_type, entity_id, date, actor, action, detail) values
  ('AC-01', 'supplier', 'S-301', '2025-05-20', 'רונית פרץ', 'תשלום בוצע',                     'חשבונית INV-3001 · ₪25,000'),
  ('AC-02', 'supplier', 'S-301', '2025-05-12', 'מערכת',     'חשבונית עברה לסטטוס באיחור',      'INV-3002'),
  ('AC-03', 'supplier', 'S-301', '2025-05-01', 'דוד לוי',   'הזמנת רכש נוצרה',                 'PO-2001'),
  ('AC-04', 'supplier', 'S-301', '2025-04-01', 'שרה כהן',   'חוזה נחתם',                       'C-1001 · ₪90,000'),
  ('AC-05', 'supplier', 'S-302', '2025-05-18', 'רונית פרץ', 'תשלום בוצע',                     'INV-3003 · ₪42,000'),
  ('AC-06', 'supplier', 'S-303', '2025-05-02', 'מערכת',     'חשבונית עברה לסטטוס באיחור',      'INV-3005'),
  ('AC-07', 'supplier', 'S-305', '2025-04-20', 'רונית פרץ', 'תשלום חלקי',                      'INV-3009 · ₪4,000 מתוך ₪8,500'),
  ('AC-08', 'supplier', 'S-305', '2025-05-06', 'שרה כהן',   'הספק הושעה',                      'חריגה מלוחות זמנים')
on conflict (id) do nothing;

-- ---------- tasks (Kanban board) ----------
-- Column named board_column, not "column" (SQL reserved word).
-- project matches Project.name in all 7 seed rows — real required FK.
create table if not exists public.tasks (
  id           text primary key,
  title        text not null,
  project_id   text not null references public.projects(id),
  assignee     text not null,
  board_column text not null check (board_column in ('todo', 'doing', 'done'))
);

alter table public.tasks enable row level security;
create policy "authenticated_full_access" on public.tasks
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.tasks to authenticated;

insert into public.tasks (id, title, project_id, assignee, board_column) values
  ('T-1', 'אישור תקציב קייטנה',        'PR-01', 'ליאת אזולאי', 'todo'),
  ('T-2', 'גיוס 5 מתנדבים נוספים',     'PR-02', 'אורן שטרן',   'todo'),
  ('T-3', 'תיאום הסעות',               'PR-01', 'דניאל מזרחי', 'doing'),
  ('T-4', 'סדנה ראשונה',               'PR-04', 'נועה ברק',    'doing'),
  ('T-5', 'חלוקת ערכות חירום',         'PR-05', 'פאדי נסר',    'doing'),
  ('T-6', 'סיכום רבעון Q1',            'PR-03', 'פאדי נסר',    'done'),
  ('T-7', 'דוח מתנדבים אפריל',         'PR-02', 'אורן שטרן',   'done')
on conflict (id) do nothing;

-- ---------- project_expenses ----------
-- Surrogate id (no id existed on the source ProjectExpenseLine type).
-- supplier resolves cleanly to a real supplier id in every row where present.
create table if not exists public.project_expenses (
  id          text primary key,
  project_id  text not null references public.projects(id),
  category    text not null,
  supplier_id text references public.suppliers(id),
  amount      numeric not null,
  date        date not null,
  status      text not null check (status in ('שולם', 'ממתין', 'חלקי'))
);

alter table public.project_expenses enable row level security;
create policy "authenticated_full_access" on public.project_expenses
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.project_expenses to authenticated;

insert into public.project_expenses (id, project_id, category, supplier_id, amount, date, status) values
  ('PE-1',  'PR-01', 'הסעות',            'S-301', 25000, '2025-05-04', 'שולם'),
  ('PE-2',  'PR-01', 'מזון וכיבוד',      'S-302', 42000, '2025-05-10', 'שולם'),
  ('PE-3',  'PR-01', 'ציוד פעילות',      'S-303', 12000, '2025-05-12', 'ממתין'),
  ('PE-4',  'PR-01', 'תוכן והדרכה',      'S-304', 18500, '2025-05-15', 'שולם'),
  ('PE-5',  'PR-01', 'דפוס וחומרים',     'S-305', 8500,  '2025-05-18', 'חלקי'),
  ('PE-6',  'PR-01', 'שכר רכזים',        null,    78000, '2025-05-20', 'שולם'),
  ('PE-7',  'PR-02', 'ציוד פעילות',      'S-303', 9500,  '2025-04-22', 'שולם'),
  ('PE-8',  'PR-02', 'תוכן והדרכה',      'S-304', 32000, '2025-05-02', 'שולם'),
  ('PE-9',  'PR-02', 'מזון',             'S-302', 14500, '2025-05-09', 'ממתין'),
  ('PE-10', 'PR-02', 'שכר רכזים',        null,    36000, '2025-05-15', 'שולם'),
  ('PE-11', 'PR-03', 'סלי מזון',         null,    64000, '2025-04-10', 'שולם'),
  ('PE-12', 'PR-03', 'שוברי סיוע',       null,    85000, '2025-04-25', 'שולם'),
  ('PE-13', 'PR-03', 'ליווי מקצועי',     'S-304', 28000, '2025-05-05', 'שולם'),
  ('PE-14', 'PR-03', 'הסעות',            'S-301', 18000, '2025-05-12', 'ממתין'),
  ('PE-15', 'PR-03', 'אדמיניסטרציה',     null,    15000, '2025-05-18', 'שולם'),
  ('PE-16', 'PR-04', 'תוכן והדרכה',      'S-304', 22000, '2025-05-01', 'שולם'),
  ('PE-17', 'PR-04', 'כיבוד',            'S-302', 6500,  '2025-05-08', 'שולם'),
  ('PE-18', 'PR-04', 'חומרי סדנה',       null,    9500,  '2025-05-14', 'ממתין'),
  ('PE-19', 'PR-05', 'ערכות חירום',      null,    8000,  '2025-05-10', 'שולם'),
  ('PE-20', 'PR-05', 'תיאום ראשוני',     null,    4000,  '2025-05-14', 'שולם'),
  ('PE-21', 'PR-06', 'תפעול שוטף',       null,    138000,'2025-03-30', 'שולם')
on conflict (id) do nothing;

-- ---------- project_phases (Gantt) ----------
-- Composite PK (project_id, phase_id) since phase ids ("PH-1".."PH-6")
-- repeat across projects. Self-referencing composite FK for depends_on,
-- deferrable so insert order within a project never matters.
create table if not exists public.project_phases (
  project_id  text not null references public.projects(id),
  phase_id    text not null,
  name        text not null,
  owner       text not null,
  start_date  date not null,
  end_date    date not null,
  progress    int not null default 0,
  depends_on  text,
  milestone   boolean not null default false,
  primary key (project_id, phase_id),
  foreign key (project_id, depends_on) references public.project_phases(project_id, phase_id) deferrable initially deferred
);

alter table public.project_phases enable row level security;
create policy "authenticated_full_access" on public.project_phases
  for all to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);
grant select, insert, update, delete on public.project_phases to authenticated;

insert into public.project_phases (project_id, phase_id, name, owner, start_date, end_date, progress, depends_on, milestone) values
  ('PR-01', 'PH-1', 'תכנון ואפיון',              'ליאת אזולאי', '2025-03-01', '2025-03-25', 100, null,   false),
  ('PR-01', 'PH-2', 'גיוס מתנדבים',              'אורן שטרן',   '2025-03-20', '2025-04-30', 85,  'PH-1', false),
  ('PR-01', 'PH-3', 'תיאום ספקים והסעות',        'דניאל מזרחי', '2025-04-01', '2025-05-15', 70,  'PH-1', false),
  ('PR-01', 'PH-4', 'אישור תקציב',                'רונית פרץ',   '2025-04-10', '2025-04-20', 100, null,   true),
  ('PR-01', 'PH-5', 'ביצוע הקייטנה',              'ליאת אזולאי', '2025-07-01', '2025-08-15', 0,   'PH-3', false),
  ('PR-01', 'PH-6', 'דוח סיכום',                  'ליאת אזולאי', '2025-08-15', '2025-08-30', 0,   'PH-5', true),

  ('PR-02', 'PH-1', 'תכנון',                      'אורן שטרן',   '2025-02-15', '2025-03-10', 100, null,   false),
  ('PR-02', 'PH-2', 'גיוס נוער',                  'אורן שטרן',   '2025-03-01', '2025-04-15', 90,  'PH-1', false),
  ('PR-02', 'PH-3', 'מפגשים שבועיים',             'תומר רז',     '2025-04-01', '2025-08-01', 45,  'PH-2', false),
  ('PR-02', 'PH-4', 'סיכום עונה',                 'אורן שטרן',   '2025-08-01', '2025-08-20', 0,   'PH-3', true),

  ('PR-03', 'PH-1', 'מיפוי משפחות',               'פאדי נסר',    '2025-01-10', '2025-02-15', 100, null,   false),
  ('PR-03', 'PH-2', 'תיאום סיוע חודשי',           'ליאת אזולאי', '2025-02-01', '2025-07-30', 80,  'PH-1', false),
  ('PR-03', 'PH-3', 'ליווי מקצועי',               'נועה ברק',    '2025-03-01', '2025-08-30', 65,  'PH-1', false),
  ('PR-03', 'PH-4', 'דוח רבעוני למשרד הקליטה',    'רונית פרץ',   '2025-06-15', '2025-07-01', 0,   null,   true),

  ('PR-04', 'PH-1', 'אפיון תכנית',                'נועה ברק',    '2025-03-01', '2025-03-20', 100, null,   false),
  ('PR-04', 'PH-2', 'גיוס משתתפות',               'נועה ברק',    '2025-03-15', '2025-04-30', 75,  'PH-1', false),
  ('PR-04', 'PH-3', 'מחזור סדנאות',                'נועה ברק',    '2025-05-01', '2025-07-15', 30,  'PH-2', false),
  ('PR-04', 'PH-4', 'אירוע סיום',                  'נועה ברק',    '2025-07-20', '2025-07-25', 0,   'PH-3', true),

  ('PR-05', 'PH-1', 'מיפוי צרכים',                'דניאל מזרחי', '2025-05-01', '2025-06-01', 30,  null,   false),
  ('PR-05', 'PH-2', 'הקמת מערך לוגיסטי',          'דניאל מזרחי', '2025-06-01', '2025-07-15', 0,   'PH-1', false),
  ('PR-05', 'PH-3', 'ביצוע בשטח',                  'פאדי נסר',    '2025-07-15', '2025-09-30', 0,   'PH-2', false),

  ('PR-06', 'PH-1', 'תפעול שוטף',                  'ליאת אזולאי', '2024-09-01', '2025-03-30', 100, null,   false),
  ('PR-06', 'PH-2', 'סיכום וסגירה',                'ליאת אזולאי', '2025-03-15', '2025-04-15', 100, null,   true)
on conflict (project_id, phase_id) do nothing;
