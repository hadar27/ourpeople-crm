-- Add id_number field to volunteers table
-- Follows the same pattern as participants who have an id_number field
-- id_number stores the 9-digit Israeli ID number (unique)

-- Helper function to validate Israeli ID numbers
-- Uses the standard Israeli ID checksum algorithm (weighted sum mod 10 = 0)
create or replace function is_valid_israeli_id(id_str text) returns boolean as $$
declare
  digits int[];
  i int;
  digit int;
  weight int;
  sum int := 0;
begin
  if id_str is null or length(id_str) != 9 then
    return false;
  end if;

  if not id_str ~ '^\d{9}$' then
    return false;
  end if;

  digits := array(select (regexp_split_to_array(id_str, ''))[i]::int from generate_series(1, 9) as i);

  for i in 1..9 loop
    weight := case when i % 2 = 1 then 1 else 2 end;
    digit := digits[i] * weight;
    if digit > 9 then
      digit := digit - 9;
    end if;
    sum := sum + digit;
  end loop;

  return (sum % 10) = 0;
end;
$$ language plpgsql immutable;

-- Helper function to generate a valid Israeli ID number
-- Generates first 8 digits deterministically, calculates valid checksum for digit 9
create or replace function generate_valid_israeli_id(seed text) returns text as $$
declare
  id_base text;
  digits int[];
  i int;
  digit int;
  weight int;
  sum int := 0;
  checksum int;
begin
  -- Generate first 8 digits from seed using hash
  id_base := '';
  for i in 1..8 loop
    id_base := id_base || ((abs(hashtext(seed || i::text)) % 10)::int)::text;
  end loop;

  -- Calculate checksum for all 9 positions
  digits := array(select (regexp_split_to_array(id_base || '0', ''))[j]::int from generate_series(1, 9) as j);

  for i in 1..8 loop
    weight := case when i % 2 = 1 then 1 else 2 end;
    digit := digits[i] * weight;
    if digit > 9 then
      digit := digit - 9;
    end if;
    sum := sum + digit;
  end loop;

  -- Calculate checksum digit (position 9 always has weight 1)
  checksum := (10 - (sum % 10)) % 10;

  return id_base || checksum::text;
end;
$$ language plpgsql immutable;

-- Add id_number column (initially nullable with unique constraint)
alter table public.volunteers
add column id_number text unique;

-- Backfill with valid synthetic Israeli ID numbers
update public.volunteers
set id_number = generate_valid_israeli_id(id)
where id_number is null;

-- Make the field non-null
alter table public.volunteers
alter column id_number set not null;
