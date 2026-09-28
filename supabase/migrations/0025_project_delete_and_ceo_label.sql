-- Keep Sarah Cohen's CEO role and allow safe project deletion by the CEO/admin only.

BEGIN;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('מנהלת העמותה', 'מנהל מערכת', 'מנהל כספים', 'מנהל פרויקטים'));

UPDATE public.users
SET role = 'מנהלת העמותה'
WHERE name = 'שרה כהן';

CREATE OR REPLACE FUNCTION public.delete_project_safely(project_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_role() NOT IN ('מנהלת העמותה', 'מנהל מערכת') THEN
    RAISE EXCEPTION 'אין הרשאה למחוק פרויקטים';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = project_value) THEN
    RAISE EXCEPTION 'הפרויקט לא נמצא';
  END IF;

  -- Do not erase any operational or financial history, including rows whose
  -- foreign keys were originally configured with ON DELETE CASCADE.
  IF EXISTS (SELECT 1 FROM public.project_expenses WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.donations WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.incomes WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.expenses WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.allocations WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.families WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.assistance WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.contracts WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.purchase_orders WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.supplier_invoices WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.tasks WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.project_phases WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.participants WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.volunteers WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.project_participants WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.project_volunteers WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.project_registration_links WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.pending_participant_registrations WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.pending_volunteer_registrations WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.budget_requests WHERE project_id = project_value)
     OR EXISTS (SELECT 1 FROM public.budget_transactions WHERE project_id = project_value) THEN
    RAISE EXCEPTION 'לא ניתן למחוק פרויקט הכולל נתונים משויכים. יש לסיים ולהעביר אותו לארכיון';
  END IF;

  DELETE FROM public.projects WHERE id = project_value;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_project_safely(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_project_safely(text) TO authenticated;

COMMIT;
