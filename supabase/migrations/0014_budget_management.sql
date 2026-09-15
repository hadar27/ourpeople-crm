-- Project budget lifecycle: initial allocation, additional requests, expenses and released balances.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS initial_budget numeric NOT NULL DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS approved_additions numeric NOT NULL DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS released_amount numeric NOT NULL DEFAULT 0;

UPDATE public.projects
SET initial_budget = budget
WHERE initial_budget = 0 AND budget > 0;

ALTER TABLE public.project_expenses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.project_expenses ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE public.project_expenses ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE public.project_expenses ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Bring existing finance expenses that already belong to a project into the shared project ledger.
INSERT INTO public.project_expenses
  (id, project_id, category, supplier_id, amount, date, status, description, reference, created_by)
SELECT
  e.id, e.project_id, e.category, e.supplier_id, e.amount, e.date, e.status,
  e.notes, e.reference, 'הסבת מערכת'
FROM public.expenses e
WHERE e.project_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.budget_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requested_amount numeric NOT NULL CHECK (requested_amount > 0),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'ממתינה' CHECK (status IN ('ממתינה', 'אושרה', 'אושרה חלקית', 'נדחתה')),
  approved_amount numeric NOT NULL DEFAULT 0 CHECK (approved_amount >= 0),
  requested_by text NOT NULL,
  reviewed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.budget_transactions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('הקצאה ראשונית', 'תוספת תקציב', 'הוצאה', 'החזרת יתרה')),
  amount numeric NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  performed_by text NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_full_access" ON public.budget_requests;
DROP POLICY IF EXISTS "authenticated_read_requests" ON public.budget_requests;
DROP POLICY IF EXISTS "authenticated_create_requests" ON public.budget_requests;
DROP POLICY IF EXISTS "finance_update_requests" ON public.budget_requests;
CREATE POLICY "authenticated_read_requests" ON public.budget_requests
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_create_requests" ON public.budget_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "finance_update_requests" ON public.budget_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('מנהל מערכת', 'מנהל כספים')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('מנהל מערכת', 'מנהל כספים')));
DROP POLICY IF EXISTS "authenticated_full_access" ON public.budget_transactions;
DROP POLICY IF EXISTS "authenticated_read_transactions" ON public.budget_transactions;
CREATE POLICY "authenticated_read_transactions" ON public.budget_transactions
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE ON public.budget_requests TO authenticated;
GRANT SELECT ON public.budget_transactions TO authenticated;

-- Seed the audit trail for existing project allocations and expenses.
INSERT INTO public.budget_transactions (project_id, transaction_type, amount, transaction_date, performed_by, reference)
SELECT id, 'הקצאה ראשונית', budget, COALESCE(start_date, CURRENT_DATE), 'הסבת מערכת', 'תקציב קיים'
FROM public.projects p
WHERE budget > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.budget_transactions t
    WHERE t.project_id = p.id AND t.transaction_type = 'הקצאה ראשונית'
  );

INSERT INTO public.budget_transactions (project_id, transaction_type, amount, transaction_date, performed_by, reference)
SELECT pe.project_id, 'הוצאה', -pe.amount, pe.date, COALESCE(pe.created_by, 'הסבת מערכת'), COALESCE(pe.reference, pe.id)
FROM public.project_expenses pe
WHERE NOT EXISTS (
  SELECT 1 FROM public.budget_transactions t
  WHERE t.project_id = pe.project_id AND t.transaction_type = 'הוצאה' AND t.reference = COALESCE(pe.reference, pe.id)
);

CREATE OR REPLACE FUNCTION public.log_initial_project_budget()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE projects SET initial_budget = NEW.budget WHERE id = NEW.id;
  IF NEW.budget > 0 THEN
    INSERT INTO budget_transactions (project_id, transaction_type, amount, transaction_date, performed_by, reference)
    VALUES (NEW.id, 'הקצאה ראשונית', NEW.budget, COALESCE(NEW.start_date, CURRENT_DATE), COALESCE(auth.jwt()->>'email', 'משתמש מערכת'), 'פתיחת פרויקט');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_project_initial_budget()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total_received numeric; total_reserved numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_received FROM donations;
  SELECT total_received + COALESCE(SUM(amount), 0) INTO total_received
  FROM incomes WHERE category <> 'תרומה' AND donation_id IS NULL;
  SELECT COALESCE(SUM(budget), 0) INTO total_reserved FROM projects;
  IF NEW.budget > total_received - total_reserved THEN
    RAISE EXCEPTION 'אין מספיק כסף זמין בקופה להקצאה זו';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_validate_initial_budget ON public.projects;
CREATE TRIGGER projects_validate_initial_budget
BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.validate_project_initial_budget();

DROP TRIGGER IF EXISTS projects_initial_budget_log ON public.projects;
CREATE TRIGGER projects_initial_budget_log
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.log_initial_project_budget();

CREATE OR REPLACE FUNCTION public.log_project_expense()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO budget_transactions (project_id, transaction_type, amount, transaction_date, performed_by, reference)
    VALUES (NEW.project_id, 'הוצאה', -NEW.amount, NEW.date, COALESCE(NEW.created_by, auth.jwt()->>'email', 'משתמש מערכת'), COALESCE(NEW.reference, NEW.id));
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM budget_transactions
    WHERE project_id = OLD.project_id AND transaction_type = 'הוצאה' AND reference = COALESCE(OLD.reference, OLD.id);
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE budget_transactions SET project_id = NEW.project_id, amount = -NEW.amount,
      transaction_date = NEW.date, reference = COALESCE(NEW.reference, NEW.id)
    WHERE project_id = OLD.project_id AND transaction_type = 'הוצאה' AND reference = COALESCE(OLD.reference, OLD.id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS project_expense_budget_log ON public.project_expenses;
CREATE TRIGGER project_expense_budget_log
AFTER INSERT OR UPDATE OR DELETE ON public.project_expenses
FOR EACH ROW EXECUTE FUNCTION public.log_project_expense();

CREATE OR REPLACE FUNCTION public.review_budget_request(
  request_id text, approved_value numeric, reviewer_name text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  request_row budget_requests%ROWTYPE;
  total_received numeric;
  total_reserved numeric;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('מנהל מערכת', 'מנהל כספים')) THEN
    RAISE EXCEPTION 'אין הרשאה לאשר בקשות תקציב';
  END IF;
  SELECT * INTO request_row FROM budget_requests WHERE id = request_id FOR UPDATE;
  IF request_row.id IS NULL OR request_row.status <> 'ממתינה' THEN
    RAISE EXCEPTION 'הבקשה אינה זמינה לאישור';
  END IF;
  IF approved_value < 0 OR approved_value > request_row.requested_amount THEN
    RAISE EXCEPTION 'סכום האישור אינו תקין';
  END IF;
  SELECT COALESCE(SUM(amount), 0) INTO total_received FROM donations;
  SELECT total_received + COALESCE(SUM(amount), 0) INTO total_received
  FROM incomes WHERE category <> 'תרומה' AND donation_id IS NULL;
  SELECT COALESCE(SUM(budget), 0) INTO total_reserved FROM projects;
  IF approved_value > total_received - total_reserved THEN
    RAISE EXCEPTION 'אין מספיק כסף זמין בקופה לאישור זה';
  END IF;

  UPDATE budget_requests SET
    approved_amount = approved_value,
    status = CASE WHEN approved_value = 0 THEN 'נדחתה' WHEN approved_value < requested_amount THEN 'אושרה חלקית' ELSE 'אושרה' END,
    reviewed_by = reviewer_name,
    reviewed_at = now()
  WHERE id = request_id;

  IF approved_value > 0 THEN
    UPDATE projects SET budget = budget + approved_value, approved_additions = approved_additions + approved_value
    WHERE id = request_row.project_id;
    INSERT INTO budget_transactions (project_id, transaction_type, amount, performed_by, reference)
    VALUES (request_row.project_id, 'תוספת תקציב', approved_value, reviewer_name, request_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_project_budget(project_value text, performer_name text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE project_row projects%ROWTYPE; spent_value numeric; release_value numeric;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('מנהל מערכת', 'מנהל כספים')) THEN
    RAISE EXCEPTION 'אין הרשאה לשחרר יתרת תקציב';
  END IF;
  SELECT * INTO project_row FROM projects WHERE id = project_value FOR UPDATE;
  SELECT COALESCE(SUM(amount), 0) INTO spent_value FROM project_expenses WHERE project_id = project_value;
  release_value := GREATEST(project_row.budget - spent_value, 0);
  IF project_row.status <> 'הסתיים' THEN RAISE EXCEPTION 'ניתן לשחרר יתרה רק בפרויקט שהסתיים'; END IF;
  IF release_value <= 0 THEN RAISE EXCEPTION 'אין יתרה זמינה לשחרור'; END IF;
  UPDATE projects SET budget = budget - release_value, released_amount = released_amount + release_value WHERE id = project_value;
  INSERT INTO budget_transactions (project_id, transaction_type, amount, performed_by, reference)
  VALUES (project_value, 'החזרת יתרה', -release_value, performer_name, 'סגירת פרויקט');
  RETURN release_value;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_budget_request(text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_project_budget(text, text) TO authenticated;
