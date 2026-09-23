-- Keep project budgets non-negative, prevent overspending, settle supplier invoices,
-- add small donations until the available pool is balanced, and remove pending aid requests.

-- Bring existing projects to a valid state before enforcing the rule.
UPDATE public.projects
SET budget = GREATEST(budget, 0),
    initial_budget = GREATEST(initial_budget, 0),
    approved_additions = GREATEST(approved_additions, 0),
    released_amount = GREATEST(released_amount, 0);

WITH spent AS (
  SELECT project_id, COALESCE(SUM(amount), 0) AS amount
  FROM public.project_expenses
  GROUP BY project_id
), adjustments AS (
  SELECT p.id,
         GREATEST(s.amount - p.budget, 0) AS addition
  FROM public.projects p
  JOIN spent s ON s.project_id = p.id
  WHERE s.amount > p.budget
), updated AS (
  UPDATE public.projects p
  SET budget = p.budget + a.addition,
      approved_additions = p.approved_additions + a.addition
  FROM adjustments a
  WHERE p.id = a.id
  RETURNING p.id, a.addition
)
INSERT INTO public.budget_transactions
  (project_id, transaction_type, amount, performed_by, reference)
SELECT u.id, 'תוספת תקציב', u.addition,
       'איזון מערכת', 'התאמת חריגה קיימת'
FROM updated u
WHERE u.addition > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.budget_transactions bt
    WHERE bt.project_id = u.id AND bt.reference = 'התאמת חריגה קיימת'
  );

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_non_negative_budget_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_non_negative_budget_check
  CHECK (budget >= 0 AND initial_budget >= 0 AND approved_additions >= 0 AND released_amount >= 0);

CREATE OR REPLACE FUNCTION public.prevent_project_overspend()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_budget numeric;
  existing_expenses numeric;
BEGIN
  IF NEW.project_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT budget INTO project_budget
  FROM projects
  WHERE id = NEW.project_id
  FOR UPDATE;

  IF project_budget IS NULL THEN
    RAISE EXCEPTION 'הפרויקט לא נמצא';
  END IF;

  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'סכום ההוצאה חייב להיות חיובי';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO existing_expenses
  FROM project_expenses
  WHERE project_id = NEW.project_id
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF existing_expenses + NEW.amount > project_budget THEN
    RAISE EXCEPTION 'אין אפשרות להוציא יותר מיתרת תקציב הפרויקט';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_expenses_prevent_overspend ON public.project_expenses;
CREATE TRIGGER project_expenses_prevent_overspend
BEFORE INSERT OR UPDATE OF project_id, amount ON public.project_expenses
FOR EACH ROW EXECUTE FUNCTION public.prevent_project_overspend();

-- An issued supplier invoice is paid under the organization's accounting policy.
UPDATE public.supplier_invoices SET status = 'שולם';
UPDATE public.suppliers SET status = 'שולם', open_invoices = 0;

INSERT INTO public.supplier_payments
  (id, supplier_id, invoice_id, amount, date, method)
SELECT 'PM-AUTO-' || si.id,
       si.supplier_id,
       si.id,
       si.amount - COALESCE(SUM(sp.amount), 0),
       si.issue_date,
       'העברה בנקאית'
FROM public.supplier_invoices si
LEFT JOIN public.supplier_payments sp
  ON sp.invoice_id = si.id AND sp.id <> 'PM-AUTO-' || si.id
GROUP BY si.id, si.supplier_id, si.amount, si.issue_date
HAVING si.amount > COALESCE(SUM(sp.amount), 0)
ON CONFLICT (id) DO UPDATE
SET amount = EXCLUDED.amount,
    date = EXCLUDED.date,
    method = EXCLUDED.method;

CREATE OR REPLACE FUNCTION public.sync_supplier_invoice_to_project_expense()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  expense_id text;
  manual_paid numeric;
  auto_payment_id text := 'PM-AUTO-' || NEW.id;
  amount_to_complete numeric;
BEGIN
  NEW.status := 'שולם';
  UPDATE suppliers SET status = 'שולם', open_invoices = 0 WHERE id = NEW.supplier_id;

  SELECT COALESCE(SUM(amount), 0) INTO manual_paid
  FROM supplier_payments
  WHERE invoice_id = NEW.id AND id <> auto_payment_id;
  amount_to_complete := GREATEST(NEW.amount - manual_paid, 0);

  IF amount_to_complete > 0 THEN
    INSERT INTO supplier_payments (id, supplier_id, invoice_id, amount, date, method)
    VALUES (auto_payment_id, NEW.supplier_id, NEW.id, amount_to_complete,
            NEW.issue_date, 'העברה בנקאית')
    ON CONFLICT (id) DO UPDATE
    SET supplier_id = EXCLUDED.supplier_id,
        amount = EXCLUDED.amount,
        date = EXCLUDED.date,
        method = EXCLUDED.method;
  ELSE
    DELETE FROM supplier_payments WHERE id = auto_payment_id;
  END IF;

  IF NEW.project_id IS NULL THEN RETURN NEW; END IF;
  SELECT id INTO expense_id FROM project_expenses WHERE reference = NEW.id LIMIT 1;
  IF expense_id IS NULL THEN
    INSERT INTO project_expenses
      (project_id, category, supplier_id, amount, date, status, description, reference, created_by)
    VALUES
      (NEW.project_id, 'חשבונית ספק', NEW.supplier_id, NEW.amount, NEW.issue_date, 'שולם',
       'חשבונית ספק ' || NEW.id, NEW.id, 'סנכרון חשבוניות');
  ELSE
    UPDATE project_expenses
    SET project_id = NEW.project_id, supplier_id = NEW.supplier_id, amount = NEW.amount,
        date = NEW.issue_date, status = 'שולם', description = 'חשבונית ספק ' || NEW.id
    WHERE id = expense_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Remove unapproved aid-request records; delivered/approved assistance history remains intact.
DELETE FROM public.assistance WHERE status IN ('ממתין', 'נדחה');
DELETE FROM public.follow_ups
WHERE entity_type = 'family'
  AND (title ILIKE '%בקשת%' OR title ILIKE '%ועדת סיוע%');

-- Add several small gifts, then continue in small installments until income covers all reserved budgets.
INSERT INTO public.donations
  (id, donor_id, is_anonymous, amount, project_id, project_label, method, receipt, date, reference, notes)
VALUES
  ('DN-BAL-SMALL-01', 'D-501', false, 350,  NULL, 'תרומה כללית', 'אשראי',        'הופק', current_date - 18, 'BAL-SMALL-01', 'תרומה קטנה לאיזון הקופה'),
  ('DN-BAL-SMALL-02', 'D-502', false, 650,  NULL, 'תרומה כללית', 'העברה בנקאית', 'הופק', current_date - 15, 'BAL-SMALL-02', 'תרומה קטנה לאיזון הקופה'),
  ('DN-BAL-SMALL-03', 'D-503', false, 900,  NULL, 'תרומה כללית', 'אשראי',        'הופק', current_date - 12, 'BAL-SMALL-03', 'תרומה קטנה לאיזון הקופה'),
  ('DN-BAL-SMALL-04', 'D-504', false, 1250, NULL, 'תרומה כללית', 'שיק',          'הופק', current_date - 9,  'BAL-SMALL-04', 'תרומה קטנה לאיזון הקופה'),
  ('DN-BAL-SMALL-05', 'D-505', false, 1800, NULL, 'תרומה כללית', 'אשראי',        'הופק', current_date - 6,  'BAL-SMALL-05', 'תרומה קטנה לאיזון הקופה'),
  ('DN-BAL-SMALL-06', 'D-506', false, 2400, NULL, 'תרומה כללית', 'העברה בנקאית', 'הופק', current_date - 3,  'BAL-SMALL-06', 'תרומה קטנה לאיזון הקופה')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  total_income numeric;
  total_reserved numeric;
  shortfall numeric;
  gift_amount numeric;
  gift_index integer := 1;
  gift_id text;
  donor_ids text[] := ARRAY['D-501', 'D-502', 'D-503', 'D-504', 'D-505', 'D-506'];
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_income FROM public.donations;
  SELECT total_income + COALESCE(SUM(amount), 0) INTO total_income
  FROM public.incomes WHERE category <> 'תרומה' AND donation_id IS NULL;
  SELECT COALESCE(SUM(budget), 0) INTO total_reserved FROM public.projects;
  shortfall := GREATEST(total_reserved - total_income, 0);

  WHILE shortfall > 0 LOOP
    gift_id := 'DN-BALANCE-' || LPAD(gift_index::text, 4, '0');
    WHILE EXISTS (SELECT 1 FROM public.donations WHERE id = gift_id) LOOP
      gift_index := gift_index + 1;
      gift_id := 'DN-BALANCE-' || LPAD(gift_index::text, 4, '0');
    END LOOP;

    gift_amount := LEAST(shortfall, 2500);
    INSERT INTO public.donations
      (id, donor_id, is_anonymous, amount, project_id, project_label, method, receipt, date, reference, notes)
    VALUES
      (gift_id, donor_ids[((gift_index - 1) % 6) + 1], false, gift_amount, NULL,
       'תרומה כללית', 'אשראי', 'הופק', current_date,
       'BALANCE-' || LPAD(gift_index::text, 4, '0'), 'תרומה קטנה לאיזון הקופה');

    shortfall := shortfall - gift_amount;
    gift_index := gift_index + 1;
  END LOOP;
END;
$$;
