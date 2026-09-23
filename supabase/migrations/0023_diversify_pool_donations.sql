-- Replace synthetic-looking balance donations with varied gifts from new donors.
-- The final available allocation pool remains at least NIS 290,000.

INSERT INTO public.donors
  (id, name, type, total_donated, interests, status, contact, id_number, phone, email,
   preferred_channel, notes)
VALUES
  ('D-NEW-01', 'יעל כהן',             'פרטי',  0, '{}', 'פעיל', 'יעל כהן',             '700000001', '0527000001', 'yael.cohen@example.org',       'טלפון',  'תורמת חדשה'),
  ('D-NEW-02', 'עמית לוי',             'פרטי',  0, '{}', 'פעיל', 'עמית לוי',             '700000002', '0527000002', 'amit.levi@example.org',         'דוא״ל',  'תורם חדש'),
  ('D-NEW-03', 'נועה רוזן',            'פרטי',  0, '{}', 'פעיל', 'נועה רוזן',            '700000003', '0527000003', 'noa.rozen@example.org',         'טלפון',  'תורמת חדשה'),
  ('D-NEW-04', 'משפחת ברק',            'פרטי',  0, '{}', 'פעיל', 'אורית ברק',            '700000004', '0527000004', 'barak.family@example.org',      'דוא״ל',  'תורמים חדשים'),
  ('D-NEW-05', 'דניאל אברהמי',         'פרטי',  0, '{}', 'פעיל', 'דניאל אברהמי',         '700000005', '0527000005', 'daniel.avrahami@example.org',   'טלפון',  'תורם חדש'),
  ('D-NEW-06', 'מיכל שחר',             'פרטי',  0, '{}', 'פעיל', 'מיכל שחר',             '700000006', '0527000006', 'michal.shahar@example.org',     'דוא״ל',  'תורמת חדשה'),
  ('D-NEW-07', 'רועי בן דוד',          'פרטי',  0, '{}', 'פעיל', 'רועי בן דוד',          '700000007', '0527000007', 'roi.bendavid@example.org',      'טלפון',  'תורם חדש'),
  ('D-NEW-08', 'אפרת וינברג',          'פרטי',  0, '{}', 'פעיל', 'אפרת וינברג',          '700000008', '0527000008', 'efrat.weinberg@example.org',    'דוא״ל',  'תורמת חדשה'),
  ('D-NEW-09', 'קבוצת אופק בע״מ',      'תאגיד', 0, '{}', 'פעיל', 'שרון דיין',            '700000009', '0527000009', 'sharon@ofek-group.example',      'דוא״ל',  'תורם עסקי חדש'),
  ('D-NEW-10', 'חברת גליל פתרונות',    'תאגיד', 0, '{}', 'פעיל', 'מתן גולן',             '700000010', '0527000010', 'matan@galil-solutions.example',  'טלפון',  'תורם עסקי חדש'),
  ('D-NEW-11', 'קרן דרך חדשה',         'קרן',   0, '{}', 'פעיל', 'דפנה ארז',             '700000011', '0527000011', 'dafna@newway-fund.example',      'דוא״ל',  'קרן חדשה'),
  ('D-NEW-12', 'אלון ומאיה פרידמן',    'פרטי',  0, '{}', 'פעיל', 'מאיה פרידמן',          '700000012', '0527000012', 'friedman.family@example.org',   'טלפון',  'תורמים חדשים'),
  ('D-NEW-13', 'סטודיו מרום',          'תאגיד', 0, '{}', 'פעיל', 'לירון מרום',           '700000013', '0527000013', 'liron@marom-studio.example',     'דוא״ל',  'תורם עסקי חדש'),
  ('D-NEW-14', 'שירה נחמיאס',          'פרטי',  0, '{}', 'פעיל', 'שירה נחמיאס',          '700000014', '0527000014', 'shira.nahmias@example.org',      'טלפון',  'תורמת חדשה'),
  ('D-NEW-15', 'יונתן שפירא',          'פרטי',  0, '{}', 'פעיל', 'יונתן שפירא',          '700000015', '0527000015', 'yonatan.shapira@example.org',    'דוא״ל',  'תורם חדש'),
  ('D-NEW-16', 'קרן ביחד',             'קרן',   0, '{}', 'פעיל', 'עדי שלו',              '700000016', '0527000016', 'adi@beyachad-fund.example',      'טלפון',  'קרן חדשה'),
  ('D-NEW-17', 'הילה מזרחי',           'פרטי',  0, '{}', 'פעיל', 'הילה מזרחי',           '700000017', '0527000017', 'hila.mizrahi@example.org',       'דוא״ל',  'תורמת חדשה'),
  ('D-NEW-18', 'עסקי הדרום בע״מ',      'תאגיד', 0, '{}', 'פעיל', 'איתי סגל',             '700000018', '0527000018', 'itay@south-business.example',    'טלפון',  'תורם עסקי חדש')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    type = EXCLUDED.type,
    contact = EXCLUDED.contact,
    id_number = EXCLUDED.id_number,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    preferred_channel = EXCLUDED.preferred_channel,
    notes = EXCLUDED.notes,
    status = 'פעיל';

-- Remove only the generated balancing donations. Original and manually entered gifts remain untouched.
DELETE FROM public.donations
WHERE id LIKE 'DN-BALANCE-%'
   OR id LIKE 'DN-BAL-SMALL-%'
   OR id LIKE 'DN-POOL-%'
   OR id LIKE 'DN-DIVERSE-%';

DO $$
DECLARE
  total_income numeric;
  total_reserved numeric;
  amount_needed numeric;
  gift_amount numeric;
  gift_index integer := 1;
  generated_gift_id text;
  new_donor_ids text[] := ARRAY[
    'D-NEW-01', 'D-NEW-02', 'D-NEW-03', 'D-NEW-04', 'D-NEW-05', 'D-NEW-06',
    'D-NEW-07', 'D-NEW-08', 'D-NEW-09', 'D-NEW-10', 'D-NEW-11', 'D-NEW-12',
    'D-NEW-13', 'D-NEW-14', 'D-NEW-15', 'D-NEW-16', 'D-NEW-17', 'D-NEW-18'
  ];
  payment_methods text[] := ARRAY['אשראי', 'העברה בנקאית', 'שיק', 'מזומן'];
  receipt_states text[] := ARRAY['הופק', 'הופק', 'הופק', 'לא הופק'];
  gift_sizes numeric[] := ARRAY[
    380, 520, 690, 840, 975, 1100, 1280, 1450, 1670, 1900,
    2150, 2380, 2640, 2950, 3270, 3650, 4100, 4750, 5400, 6200, 7500, 8900
  ];
BEGIN
  SELECT COALESCE(SUM(d.amount), 0)
  INTO total_income
  FROM public.donations d;

  SELECT total_income + COALESCE(SUM(i.amount), 0)
  INTO total_income
  FROM public.incomes i
  WHERE i.category <> 'תרומה' AND i.donation_id IS NULL;

  SELECT COALESCE(SUM(p.budget), 0)
  INTO total_reserved
  FROM public.projects p;

  amount_needed := GREATEST(total_reserved + 290000 - total_income, 0);

  WHILE amount_needed > 0 LOOP
    generated_gift_id := 'DN-DIVERSE-' || LPAD(gift_index::text, 4, '0');
    gift_amount := LEAST(
      amount_needed,
      gift_sizes[((gift_index * 7 - 1) % array_length(gift_sizes, 1)) + 1]
    );

    INSERT INTO public.donations
      (id, donor_id, is_anonymous, amount, project_id, project_label,
       method, receipt, date, reference, notes)
    VALUES
      (generated_gift_id,
       new_donor_ids[((gift_index * 5 - 1) % array_length(new_donor_ids, 1)) + 1],
       false,
       gift_amount,
       NULL,
       'תרומה כללית',
       payment_methods[((gift_index * 3 - 1) % array_length(payment_methods, 1)) + 1],
       receipt_states[((gift_index * 7 - 1) % array_length(receipt_states, 1)) + 1],
       current_date - ((gift_index * 11) % 210),
       'DIVERSE-' || LPAD(gift_index::text, 4, '0'),
       CASE
         WHEN gift_amount < 1000 THEN 'תרומה פרטית'
         WHEN gift_amount < 4000 THEN 'תרומה חודשית'
         ELSE 'תרומה כללית לעמותה'
       END);

    amount_needed := amount_needed - gift_amount;
    gift_index := gift_index + 1;
  END LOOP;
END;
$$;
