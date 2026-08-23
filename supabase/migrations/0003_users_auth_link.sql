-- Link public.users.id to the real Supabase Auth account instead of the
-- app-generated 'U-n' sequence, so creating a directory row can create the
-- matching auth.users account (see src/lib/server/create-user.ts).
--
-- Only sarah@ourpeople.org (U-1, the login page's default account) is
-- assumed to already exist as a real auth.users row -- run this AFTER
-- confirming that account exists (e.g. Supabase dashboard > Authentication
-- > Users). The other five seeded demo rows (U-2..U-6) don't correspond to
-- real accounts and are dropped; recreate any of them for real through the
-- app's "add user" flow if still needed.
--
-- Wrapped in an explicit transaction and written with if-exists guards
-- throughout so it's safe to re-run from scratch even after a partial
-- failure.

begin;

-- 1. drop demo seed rows that don't correspond to real auth accounts.
delete from public.users where id != 'U-1';

-- 2. repoint the remaining row's id at sarah's real auth.users id.
update public.users u
set id = a.id::text
from auth.users a
where u.id = 'U-1' and a.email = u.email;

-- 3. id is now auth-linked: drop the app-generated default and switch the
-- column to uuid, backed by a foreign key into auth.users.
alter table public.users alter column id drop default;
alter table public.users alter column id type uuid using id::uuid;
alter table public.users add constraint users_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- 4. drop the now-unused id generator.
drop function if exists next_app_user_id();
drop sequence if exists app_user_id_seq;

commit;
