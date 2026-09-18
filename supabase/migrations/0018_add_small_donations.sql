-- Add a broader mix of realistic small and medium donations for the current year.
-- Stable IDs and ON CONFLICT make this migration safe to run more than once.
insert into public.donations
  (id, donor_id, is_anonymous, amount, project_id, project_label, method, receipt, date, reference, notes)
values
  ('DN-SMALL-01', 'D-501', false,  180, 'PR-03', 'ליווי משפחות עולים',  'אשראי',        'הופק',    current_date - 95, 'SMALL-01', 'תרומה פרטית'),
  ('DN-SMALL-02', 'D-502', false,  350, 'PR-02', 'תכנית מנהיגות לנוער', 'העברה בנקאית', 'הופק',    current_date - 82, 'SMALL-02', 'תרומה פרטית'),
  ('DN-SMALL-03', 'D-503', false,  480, 'PR-04', 'סדנת העצמה לנשים',    'אשראי',        'לא הופק', current_date - 71, 'SMALL-03', 'תרומה פרטית'),
  ('DN-SMALL-04', 'D-504', false,  750, 'PR-01', 'קייטנת קיץ',          'מזומן',        'הופק',    current_date - 63, 'SMALL-04', 'תרומה פרטית'),
  ('DN-SMALL-05', 'D-505', false,  950, 'PR-05', 'חירום ושיקום קהילתי', 'שיק',          'הופק',    current_date - 52, 'SMALL-05', 'תרומה פרטית'),
  ('DN-SMALL-06', 'D-506', false, 1200, 'PR-03', 'ליווי משפחות עולים',  'אשראי',        'הופק',    current_date - 44, 'SMALL-06', 'תרומה חודשית'),
  ('DN-SMALL-07', 'D-501', false, 1800, 'PR-02', 'תכנית מנהיגות לנוער', 'העברה בנקאית', 'הופק',    current_date - 36, 'SMALL-07', 'תרומה נוספת'),
  ('DN-SMALL-08', 'D-502', false, 2400, 'PR-04', 'סדנת העצמה לנשים',    'אשראי',        'לא הופק', current_date - 29, 'SMALL-08', 'תרומה נוספת'),
  ('DN-SMALL-09', 'D-503', false, 3200, 'PR-01', 'קייטנת קיץ',          'העברה בנקאית', 'הופק',    current_date - 21, 'SMALL-09', 'תרומה לפרויקט'),
  ('DN-SMALL-10', 'D-504', false, 4500, 'PR-05', 'חירום ושיקום קהילתי', 'שיק',          'הופק',    current_date - 14, 'SMALL-10', 'תרומה לפרויקט'),
  ('DN-SMALL-11', 'D-505', false, 6500, 'PR-03', 'ליווי משפחות עולים',  'העברה בנקאית', 'הופק',    current_date - 7,  'SMALL-11', 'תרומה לפרויקט'),
  ('DN-SMALL-12', null,    true,  8900, null,    'תרומה כללית',          'אשראי',        'הופק',    current_date - 2,  'SMALL-12', 'תרומה אנונימית')
on conflict (id) do nothing;
