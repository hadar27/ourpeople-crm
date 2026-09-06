-- Add unique constraint to participants.id_number
-- Volunteers already has unique constraint on id_number (from 0006_add_volunteer_id_number.sql)
-- This migration adds the same constraint to participants to ensure no duplicate Israeli IDs

alter table public.participants
add constraint participants_id_number_unique unique (id_number);
