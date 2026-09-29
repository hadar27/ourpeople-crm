-- Project participation pricing and an auditable payment acknowledgement.

BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'חינמית',
  ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_type_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_type_check CHECK (type IN ('חינמית', 'בתשלום'));

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_payment_details_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_payment_details_check CHECK (
    (type = 'חינמית' AND price = 0)
    OR (type = 'בתשלום' AND price > 0)
  );

ALTER TABLE public.pending_participant_registrations
  ADD COLUMN IF NOT EXISTS payment_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreed_price numeric NOT NULL DEFAULT 0;

ALTER TABLE public.project_participants
  ADD COLUMN IF NOT EXISTS payment_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreed_price numeric NOT NULL DEFAULT 0;

ALTER TABLE public.pending_participant_registrations
  DROP CONSTRAINT IF EXISTS pending_participant_agreed_price_check;
ALTER TABLE public.pending_participant_registrations
  ADD CONSTRAINT pending_participant_agreed_price_check CHECK (agreed_price >= 0);

ALTER TABLE public.project_participants
  DROP CONSTRAINT IF EXISTS project_participants_agreed_price_check;
ALTER TABLE public.project_participants
  ADD CONSTRAINT project_participants_agreed_price_check CHECK (agreed_price >= 0);

CREATE OR REPLACE FUNCTION public.validate_participant_payment_acknowledgement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_type text;
  project_price numeric;
BEGIN
  SELECT p.type, p.price
  INTO project_type, project_price
  FROM public.projects p
  WHERE p.id = NEW.project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'הפרויקט לא נמצא';
  END IF;

  IF project_type = 'בתשלום' THEN
    IF project_price <= 0 THEN
      RAISE EXCEPTION 'לפרויקט בתשלום לא הוגדר מחיר תקין';
    END IF;
    IF NOT COALESCE(NEW.payment_acknowledged, false) THEN
      RAISE EXCEPTION 'יש לאשר את תנאי התשלום לפרויקט';
    END IF;
    NEW.agreed_price := project_price;
    NEW.payment_status := 'לא שולם';
  ELSE
    NEW.payment_acknowledged := false;
    NEW.agreed_price := 0;
    NEW.payment_status := 'לא נדרש תשלום';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pending_participant_validate_payment
  ON public.pending_participant_registrations;
CREATE TRIGGER pending_participant_validate_payment
BEFORE INSERT OR UPDATE OF project_id, payment_acknowledged
ON public.pending_participant_registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_participant_payment_acknowledgement();

COMMIT;
