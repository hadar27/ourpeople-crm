-- Add demographic and allergy fields to participants
-- date_of_birth: participant's birth date
-- sex: gender/sex field
-- parent_name: name of parent/guardian
-- parent_phone: contact phone for parent/guardian
-- food_allergies: nullable text field describing food allergies

alter table public.participants
add column date_of_birth date,
add column sex text check (sex in ('זכר', 'נקבה')),
add column parent_name text,
add column parent_phone text,
add column food_allergies text;

alter table public.pending_participant_registrations
add column date_of_birth date,
add column sex text check (sex in ('זכר', 'נקבה')),
add column parent_name text,
add column parent_phone text,
add column food_allergies text;
