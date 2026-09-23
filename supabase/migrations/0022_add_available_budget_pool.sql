-- Add realistic small and medium donations until at least NIS 30,000
-- remains available after all currently reserved project budgets.
DO $$
DECLARE
  total_income numeric;
  total_reserved numeric;
  amount_needed numeric;
  donation_amount numeric;
  donation_index integer := 1;
  donation_id text;
  donor_ids text[] := ARRAY['D-501', 'D-502', 'D-503', 'D-504', 'D-505', 'D-506'];
  payment_methods text[] := ARRAY['אשראי', 'העברה בנקאית', 'שיק'];
  donation_sizes numeric[] := ARRAY[450, 750, 1200, 1800, 2400, 3200, 4200, 5000];
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO total_income
  FROM public.donations;

  SELECT total_income + COALESCE(SUM(amount), 0)
  INTO total_income
  FROM public.incomes
  WHERE category <> 'תרומה' AND donation_id IS NULL;

  SELECT COALESCE(SUM(budget), 0)
  INTO total_reserved
  FROM public.projects;

  amount_needed := GREATEST(total_reserved + 30000 - total_income, 0);

  WHILE amount_needed > 0 LOOP
    donation_id := 'DN-POOL-' || LPAD(donation_index::text, 4, '0');
    WHILE EXISTS (SELECT 1 FROM public.donations WHERE id = donation_id) LOOP
      donation_index := donation_index + 1;
      donation_id := 'DN-POOL-' || LPAD(donation_index::text, 4, '0');
    END LOOP;

    donation_amount := LEAST(
      amount_needed,
      donation_sizes[((donation_index - 1) % array_length(donation_sizes, 1)) + 1]
    );

    INSERT INTO public.donations
      (id, donor_id, is_anonymous, amount, project_id, project_label,
       method, receipt, date, reference, notes)
    VALUES
      (donation_id,
       donor_ids[((donation_index - 1) % array_length(donor_ids, 1)) + 1],
       false,
       donation_amount,
       NULL,
       'תרומה כללית',
       payment_methods[((donation_index - 1) % array_length(payment_methods, 1)) + 1],
       'הופק',
       current_date - ((donation_index - 1) % 25),
       'POOL-' || LPAD(donation_index::text, 4, '0'),
       'תרומה לקופה הזמינה');

    amount_needed := amount_needed - donation_amount;
    donation_index := donation_index + 1;
  END LOOP;
END;
$$;
