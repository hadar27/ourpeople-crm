-- service_role (used server-side by src/lib/create-user.ts to look up the
-- calling admin's role before creating a new user, and to insert the new
-- user's row) was hitting "permission denied for table users": public.users
-- only explicitly grants `to authenticated` (see 0001_full_migration.sql),
-- and this project's service_role only had REFERENCES/TRIGGER/TRUNCATE on
-- it -- not the usual full default privileges Supabase projects normally
-- grant service_role automatically. Grant it explicitly.

grant select, insert, update, delete on public.users to service_role;
