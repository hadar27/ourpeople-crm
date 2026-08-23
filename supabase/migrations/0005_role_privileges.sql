-- Replace the 5-role matrix with a 3-role privilege model, enforced in RLS
-- (not just client-side): admin (מנהל מערכת, full control), project manager
-- (מנהל פרויקטים, everything except finance + users), financial manager
-- (מנהל כספים, everything except users).
--
-- "Finance" for RLS purposes is donations + allocations + incomes + expenses
-- only -- project-/supplier-operational money tables (project_expenses,
-- contracts, purchase_orders, supplier_invoices, supplier_payments) stay on
-- the existing open policy, as do all other tables. Only users/donations/
-- allocations/incomes/expenses get new policies below.
--
-- Wrapped in an explicit transaction with if-exists guards so it's safe to
-- re-run from scratch even after a partial failure.

begin;

-- 1. role check constraint: 3 values instead of 5. Only one real account
-- exists (sarah, already 'מנהל מערכת') so no data backfill needed.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('מנהל מערכת', 'מנהל כספים', 'מנהל פרויקטים'));

-- 2. security-definer helper so RLS policies can resolve the caller's role
-- without recursing into users' own RLS.
create or replace function public.current_user_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;
grant execute on function public.current_user_role() to authenticated;

-- 3. users: everyone reads their own row (needed so any signed-in user can
-- resolve their own role client-side); only admin reads the full list or
-- writes.
drop policy if exists "authenticated_full_access" on public.users;

create policy "users_select_own_or_admin" on public.users
  for select to authenticated
  using (id = auth.uid() or public.current_user_role() = 'מנהל מערכת');

create policy "users_admin_insert" on public.users
  for insert to authenticated
  with check (public.current_user_role() = 'מנהל מערכת');

create policy "users_admin_update" on public.users
  for update to authenticated
  using (public.current_user_role() = 'מנהל מערכת')
  with check (public.current_user_role() = 'מנהל מערכת');

create policy "users_admin_delete" on public.users
  for delete to authenticated
  using (public.current_user_role() = 'מנהל מערכת');

-- 4. finance tables: admin + financial manager only. Project manager loses
-- both read and write (RLS filters rows to empty rather than erroring).
drop policy if exists "authenticated_full_access" on public.donations;
create policy "finance_access" on public.donations
  for all to authenticated
  using (public.current_user_role() in ('מנהל מערכת', 'מנהל כספים'))
  with check (public.current_user_role() in ('מנהל מערכת', 'מנהל כספים'));

drop policy if exists "authenticated_full_access" on public.allocations;
create policy "finance_access" on public.allocations
  for all to authenticated
  using (public.current_user_role() in ('מנהל מערכת', 'מנהל כספים'))
  with check (public.current_user_role() in ('מנהל מערכת', 'מנהל כספים'));

drop policy if exists "authenticated_full_access" on public.incomes;
create policy "finance_access" on public.incomes
  for all to authenticated
  using (public.current_user_role() in ('מנהל מערכת', 'מנהל כספים'))
  with check (public.current_user_role() in ('מנהל מערכת', 'מנהל כספים'));

drop policy if exists "authenticated_full_access" on public.expenses;
create policy "finance_access" on public.expenses
  for all to authenticated
  using (public.current_user_role() in ('מנהל מערכת', 'מנהל כספים'))
  with check (public.current_user_role() in ('מנהל מערכת', 'מנהל כספים'));

commit;
