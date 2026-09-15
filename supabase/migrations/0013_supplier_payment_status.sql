-- Replace the supplier lifecycle status with the requested payment status.
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_status_check;

UPDATE suppliers
SET status = CASE
  WHEN open_invoices > 0 THEN 'לא שולם'
  ELSE 'שולם'
END
WHERE status NOT IN ('שולם', 'לא שולם');

ALTER TABLE suppliers ALTER COLUMN status SET DEFAULT 'לא שולם';
ALTER TABLE suppliers
  ADD CONSTRAINT suppliers_status_check CHECK (status IN ('שולם', 'לא שולם'));
