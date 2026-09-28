-- Initial project budgets require finance approval before a project becomes active.
-- Also adds the CEO role and read-only access to all modules for project managers.

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS requested_initial_budget numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'ממתין לאישור',
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

UPDATE public.projects
SET requested_initial_budget = CASE
      WHEN requested_initial_budget = 0 THEN initial_budget
      ELSE requested_initial_budget
    END,
    approval_status = 'מאושר',
    approved_by = COALESCE(approved_by, 'הסבת מערכת'),
    approved_at = COALESCE(approved_at, created_at, now());

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_approval_status_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_approval_status_check
  CHECK (approval_status IN ('ממתין לאישור', 'מאושר', 'נדחה'));

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_requested_initial_budget_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_requested_initial_budget_check CHECK (requested_initial_budget >= 0);

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_start_after_approval_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_start_after_approval_check
  CHECK (approval_status = 'מאושר' OR status = 'בתכנון');

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים', 'מנהל פרויקטים'));

UPDATE public.users
SET role = 'מנהלת העמותה'
WHERE name = 'שרה כהן';

-- CEO can administer users. Other roles retain access to their own staff record only.
DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_select_all_roles" ON public.users;
CREATE POLICY "users_select_own_or_admin" ON public.users
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת')
  );

DROP POLICY IF EXISTS "users_admin_insert" ON public.users;
CREATE POLICY "users_admin_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת'));

DROP POLICY IF EXISTS "users_admin_update" ON public.users;
CREATE POLICY "users_admin_update" ON public.users
  FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת'))
  WITH CHECK (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת'));

DROP POLICY IF EXISTS "users_admin_delete" ON public.users;
CREATE POLICY "users_admin_delete" ON public.users
  FOR DELETE TO authenticated
  USING (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת'));

-- The CEO receives the same finance-table access as the existing admin and finance roles.
DROP POLICY IF EXISTS "finance_access" ON public.donations;
CREATE POLICY "finance_access" ON public.donations
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים'))
  WITH CHECK (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים'));
DROP POLICY IF EXISTS "project_manager_finance_read" ON public.donations;
CREATE POLICY "project_manager_finance_read" ON public.donations
  FOR SELECT TO authenticated USING (public.current_user_role() = 'מנהל פרויקטים');

DROP POLICY IF EXISTS "finance_access" ON public.allocations;
CREATE POLICY "finance_access" ON public.allocations
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים'))
  WITH CHECK (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים'));
DROP POLICY IF EXISTS "project_manager_finance_read" ON public.allocations;
CREATE POLICY "project_manager_finance_read" ON public.allocations
  FOR SELECT TO authenticated USING (public.current_user_role() = 'מנהל פרויקטים');

DROP POLICY IF EXISTS "finance_access" ON public.incomes;
CREATE POLICY "finance_access" ON public.incomes
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים'))
  WITH CHECK (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים'));
DROP POLICY IF EXISTS "project_manager_finance_read" ON public.incomes;
CREATE POLICY "project_manager_finance_read" ON public.incomes
  FOR SELECT TO authenticated USING (public.current_user_role() = 'מנהל פרויקטים');

DROP POLICY IF EXISTS "finance_access" ON public.expenses;
CREATE POLICY "finance_access" ON public.expenses
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים'))
  WITH CHECK (public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים'));
DROP POLICY IF EXISTS "project_manager_finance_read" ON public.expenses;
CREATE POLICY "project_manager_finance_read" ON public.expenses
  FOR SELECT TO authenticated USING (public.current_user_role() = 'מנהל פרויקטים');

CREATE OR REPLACE FUNCTION public.review_initial_project_budget(
  project_value text,
  approve_value boolean,
  reviewer_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_row public.projects%ROWTYPE;
  total_received numeric;
  total_reserved numeric;
  available_pool numeric;
BEGIN
  IF public.current_user_role() <> 'מנהל כספים' THEN
    RAISE EXCEPTION 'רק מנהל הכספים רשאי לאשר תקציב ראשוני לפרויקט';
  END IF;

  SELECT * INTO project_row
  FROM public.projects
  WHERE id = project_value
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'הפרויקט לא נמצא';
  END IF;
  IF project_row.approval_status <> 'ממתין לאישור' THEN
    RAISE EXCEPTION 'הפרויקט כבר נבדק';
  END IF;

  IF NOT approve_value THEN
    UPDATE public.projects
    SET approval_status = 'נדחה', approved_by = reviewer_name, approved_at = now(),
        budget = 0, initial_budget = 0
    WHERE id = project_value;
    RETURN;
  END IF;

  SELECT COALESCE(SUM(d.amount), 0) +
         COALESCE((SELECT SUM(i.amount) FROM public.incomes i
                   WHERE i.category <> 'תרומה' AND i.donation_id IS NULL), 0)
  INTO total_received
  FROM public.donations d;

  SELECT COALESCE(SUM(p.budget), 0)
  INTO total_reserved
  FROM public.projects p
  WHERE p.approval_status = 'מאושר';

  available_pool := total_received - total_reserved;
  IF project_row.requested_initial_budget > available_pool THEN
    RAISE EXCEPTION 'אין מספיק כסף זמין בקופה לאישור התקציב הראשוני';
  END IF;

  UPDATE public.projects
  SET budget = requested_initial_budget,
      initial_budget = requested_initial_budget,
      approval_status = 'מאושר',
      approved_by = reviewer_name,
      approved_at = now()
  WHERE id = project_value;

  IF project_row.requested_initial_budget > 0 THEN
    INSERT INTO public.budget_transactions
      (project_id, transaction_type, amount, transaction_date, performed_by, reference)
    VALUES
      (project_value, 'הקצאה ראשונית', project_row.requested_initial_budget,
       CURRENT_DATE, reviewer_name, 'אישור תקציב ראשוני');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_initial_project_budget(text, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_initial_project_budget(text, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_additional_budget_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_budget numeric;
  project_approval text;
  project_spent numeric;
BEGIN
  SELECT budget, approval_status
  INTO project_budget, project_approval
  FROM public.projects
  WHERE id = NEW.project_id;

  SELECT COALESCE(SUM(amount), 0)
  INTO project_spent
  FROM public.project_expenses
  WHERE project_id = NEW.project_id;

  IF project_approval <> 'מאושר' OR project_budget <= 0 THEN
    RAISE EXCEPTION 'לא ניתן לבקש תוספת תקציב לפני אישור התקציב הראשוני';
  END IF;
  IF project_spent / project_budget < 0.9 THEN
    RAISE EXCEPTION 'ניתן לבקש תקציב נוסף רק לאחר ניצול של לפחות 90%% מהתקציב';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS budget_requests_validate_utilization ON public.budget_requests;
CREATE TRIGGER budget_requests_validate_utilization
BEFORE INSERT ON public.budget_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_additional_budget_request();

COMMIT;
