-- Payment belongs to a participant's registration for a specific project.
BEGIN;

ALTER TABLE public.project_participants
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS agreed_price numeric NOT NULL DEFAULT 0;

UPDATE public.project_participants AS pp
SET payment_status = CASE
      WHEN pr.type = 'חינמית' THEN 'לא נדרש תשלום'
      WHEN p.project_id = pp.project_id AND p.payment_status <> 'לא נדרש תשלום'
        THEN p.payment_status
      ELSE 'לא שולם'
    END
FROM public.participants AS p, public.projects AS pr
WHERE p.id = pp.participant_id AND pr.id = pp.project_id
  AND pp.payment_status IS NULL;

UPDATE public.project_participants AS pp
SET agreed_price = pr.price
FROM public.projects AS pr
WHERE pr.id = pp.project_id AND pr.type = 'בתשלום' AND pp.agreed_price = 0;

ALTER TABLE public.project_participants
  ALTER COLUMN payment_status SET DEFAULT 'לא שולם',
  ALTER COLUMN payment_status SET NOT NULL;
ALTER TABLE public.project_participants DROP CONSTRAINT IF EXISTS project_participants_payment_status_check;
ALTER TABLE public.project_participants ADD CONSTRAINT project_participants_payment_status_check
  CHECK (payment_status IN ('שולם', 'שולם חלקית', 'לא שולם', 'לא נדרש תשלום'));

CREATE OR REPLACE FUNCTION public.normalize_project_participant_payment()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE project_type text; project_price numeric;
BEGIN
  SELECT p.type, p.price INTO project_type, project_price
  FROM public.projects AS p WHERE p.id = NEW.project_id;
  IF project_type = 'חינמית' THEN
    NEW.payment_status := 'לא נדרש תשלום';
    NEW.agreed_price := 0;
  ELSE
    IF NEW.payment_status IS NULL OR NEW.payment_status = 'לא נדרש תשלום' THEN
      NEW.payment_status := 'לא שולם';
    END IF;
    IF COALESCE(NEW.agreed_price, 0) = 0 THEN NEW.agreed_price := project_price; END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS project_participant_normalize_payment ON public.project_participants;
CREATE TRIGGER project_participant_normalize_payment
BEFORE INSERT OR UPDATE OF project_id, payment_status ON public.project_participants
FOR EACH ROW EXECUTE FUNCTION public.normalize_project_participant_payment();

CREATE OR REPLACE FUNCTION public.sync_primary_participant_payment()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  INSERT INTO public.project_participants (project_id, participant_id, payment_status)
  VALUES (NEW.project_id, NEW.id, NEW.payment_status)
  ON CONFLICT (project_id, participant_id) DO UPDATE
    SET payment_status = EXCLUDED.payment_status
    WHERE public.project_participants.payment_status IS DISTINCT FROM EXCLUDED.payment_status;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS participant_sync_primary_payment ON public.participants;
CREATE TRIGGER participant_sync_primary_payment
AFTER INSERT OR UPDATE OF payment_status, project_id ON public.participants
FOR EACH ROW EXECUTE FUNCTION public.sync_primary_participant_payment();

CREATE OR REPLACE FUNCTION public.sync_registration_payment_to_primary()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  UPDATE public.participants AS p SET payment_status = NEW.payment_status
  WHERE p.id = NEW.participant_id AND p.project_id = NEW.project_id
    AND p.payment_status IS DISTINCT FROM NEW.payment_status;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS registration_sync_primary_payment ON public.project_participants;
CREATE TRIGGER registration_sync_primary_payment
AFTER INSERT OR UPDATE OF payment_status ON public.project_participants
FOR EACH ROW EXECUTE FUNCTION public.sync_registration_payment_to_primary();

INSERT INTO public.project_participants (project_id, participant_id, payment_status)
SELECT p.project_id, p.id, p.payment_status FROM public.participants AS p
ON CONFLICT (project_id, participant_id) DO NOTHING;

UPDATE public.participants AS p SET payment_status = pp.payment_status
FROM public.project_participants AS pp
WHERE pp.participant_id = p.id AND pp.project_id = p.project_id
  AND p.payment_status IS DISTINCT FROM pp.payment_status;

CREATE OR REPLACE FUNCTION public.sync_project_pricing_to_registrations()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type THEN
    UPDATE public.project_participants AS pp
    SET payment_status = CASE WHEN NEW.type = 'חינמית' THEN 'לא נדרש תשלום'
          WHEN pp.payment_status = 'לא נדרש תשלום' THEN 'לא שולם' ELSE pp.payment_status END,
        agreed_price = CASE WHEN NEW.type = 'חינמית' THEN 0 ELSE NEW.price END
    WHERE pp.project_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS project_sync_participation_pricing ON public.projects;
CREATE TRIGGER project_sync_participation_pricing
AFTER UPDATE OF type, price ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.sync_project_pricing_to_registrations();

COMMIT;
