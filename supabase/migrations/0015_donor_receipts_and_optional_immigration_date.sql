alter table public.donations
  drop constraint if exists donations_receipt_check;

-- Keep receipt status identical wherever a donation is displayed.
update public.donations
set receipt = 'לא הופק'
where receipt in ('ממתין', 'חסר');

alter table public.donations
  add constraint donations_receipt_check
  check (receipt in ('הופק', 'לא הופק'));

alter table public.donations
  alter column receipt set default 'לא הופק';

-- The form treats immigration date as optional, so the database must do the same.
alter table public.families
  alter column immigration_date drop not null;

-- Enforce the required donor contact details for every new or changed row,
-- while allowing historical rows to be completed through the edit form.
alter table public.donors
  drop constraint if exists donors_required_contact_details_check;

alter table public.donors
  add constraint donors_required_contact_details_check
  check (
    nullif(btrim(id_number), '') is not null
    and nullif(btrim(phone), '') is not null
    and nullif(btrim(email), '') is not null
  ) not valid;
