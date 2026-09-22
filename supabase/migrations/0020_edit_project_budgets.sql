-- Allow finance managers to correct a project's initial allocation and approved additions
-- while preserving the available-pool rules and the budget audit trail.
CREATE OR REPLACE FUNCTION public.update_project_budget(
  project_value text,
  initial_value numeric,
  additions_value numeric,
  performer_name text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_row projects%ROWTYPE;
  spent_value numeric;
  updated_budget numeric;
  initial_delta numeric;
  additions_delta numeric;
  total_received numeric;
  total_reserved numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid()
      AND u.role IN ('מנהל מערכת', 'מנהל כספים')
  ) THEN
    RAISE EXCEPTION 'אין הרשאה לערוך תקציבי פרויקטים';
  END IF;

  IF initial_value < 0 OR additions_value < 0 THEN
    RAISE EXCEPTION 'סכומי התקציב אינם יכולים להיות שליליים';
  END IF;

  SELECT * INTO project_row
  FROM projects
  WHERE id = project_value
  FOR UPDATE;

  IF project_row.id IS NULL THEN
    RAISE EXCEPTION 'הפרויקט לא נמצא';
  END IF;

  updated_budget := initial_value + additions_value - project_row.released_amount;
  IF updated_budget < 0 THEN
    RAISE EXCEPTION 'התקציב המעודכן נמוך מהסכום שכבר הוחזר לקופה';
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO spent_value
  FROM project_expenses
  WHERE project_id = project_value;

  IF updated_budget < spent_value THEN
    RAISE EXCEPTION 'לא ניתן להגדיר תקציב נמוך מסך ההוצאות שכבר נרשמו';
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO total_received
  FROM donations;

  SELECT total_received + COALESCE(SUM(amount), 0)
  INTO total_received
  FROM incomes
  WHERE category <> 'תרומה' AND donation_id IS NULL;

  SELECT COALESCE(SUM(budget), 0)
  INTO total_reserved
  FROM projects;

  IF updated_budget - project_row.budget > total_received - total_reserved THEN
    RAISE EXCEPTION 'אין מספיק כסף זמין בקופה להגדלת התקציב';
  END IF;

  initial_delta := initial_value - project_row.initial_budget;
  additions_delta := additions_value - project_row.approved_additions;

  UPDATE projects
  SET initial_budget = initial_value,
      approved_additions = additions_value,
      budget = updated_budget
  WHERE id = project_value;

  IF initial_delta <> 0 THEN
    INSERT INTO budget_transactions
      (project_id, transaction_type, amount, performed_by, reference)
    VALUES
      (project_value, 'הקצאה ראשונית', initial_delta, performer_name, 'עריכת תקציב');
  END IF;

  IF additions_delta <> 0 THEN
    INSERT INTO budget_transactions
      (project_id, transaction_type, amount, performed_by, reference)
    VALUES
      (project_value, 'תוספת תקציב', additions_delta, performer_name, 'עריכת תקציב');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.update_project_budget(text, numeric, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_project_budget(text, numeric, numeric, text) TO authenticated;
