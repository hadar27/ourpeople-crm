-- Target participants used by the weighted project-progress calculation.
BEGIN;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS target_participants integer NOT NULL DEFAULT 0;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_target_participants_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_target_participants_check CHECK (target_participants >= 0);

COMMIT;
