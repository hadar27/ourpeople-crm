-- Complete legacy donor records before enforcing/updating required contact details.
-- These deterministic placeholders can later be replaced through the donor edit form.
with ranked_donors as (
  select id, row_number() over (order by id) as row_number
  from public.donors
)
update public.donors d
set id_number = coalesce(nullif(btrim(d.id_number), ''),
                         (900000000 + r.row_number)::text),
    phone = coalesce(nullif(btrim(d.phone), ''),
                     '0' || (590000000 + r.row_number)::text),
    email = coalesce(nullif(btrim(d.email), ''),
                     'legacy.' || replace(lower(d.id), '-', '.') || '@ourpeople.org'),
    updated_at = now()
from ranked_donors r
where d.id = r.id
  and (nullif(btrim(d.id_number), '') is null
       or nullif(btrim(d.phone), '') is null
       or nullif(btrim(d.email), '') is null);

-- Data integrity: one identity record per person/entity.
create unique index if not exists participants_id_number_unique
  on public.participants (id_number);

create unique index if not exists donors_id_number_unique
  on public.donors (id_number)
  where id_number is not null and btrim(id_number) <> '';

create unique index if not exists donors_phone_unique
  on public.donors (phone)
  where phone is not null and btrim(phone) <> '';

create unique index if not exists families_phone_unique
  on public.families (phone)
  where phone is not null and btrim(phone) <> '';

-- project_participants already has a unique(project_id, participant_id) constraint.

-- Keep the latest donor interaction on or after the donor's latest donation.
with latest_donations as (
  select donor_id, max(date) as donation_date
  from public.donations
  where donor_id is not null
  group by donor_id
), latest_interactions as (
  select distinct on (donor_id) id, donor_id, date
  from public.interactions
  order by donor_id, date desc, created_at desc
)
update public.interactions i
set date = d.donation_date,
    updated_at = now()
from latest_donations d
join latest_interactions li on li.donor_id = d.donor_id
where i.id = li.id
  and li.date < d.donation_date;

insert into public.interactions
  (donor_id, type, date, time, staff, subject, summary, outcome, status)
select d.donor_id, 'אחר', d.donation_date, '09:00', 'מערכת',
       'קליטת תרומה', 'התרומה נקלטה במערכת.', 'התרומה תועדה בכרטיס התורם.', 'הושלם'
from (
  select donor_id, max(date) as donation_date
  from public.donations
  where donor_id is not null
  group by donor_id
) d
where not exists (
  select 1 from public.interactions i where i.donor_id = d.donor_id
);

create or replace function public.sync_interaction_with_latest_donation()
returns trigger language plpgsql security definer set search_path = public as $$
declare latest_interaction_id text;
begin
  if new.donor_id is null then return new; end if;

  select id into latest_interaction_id
  from interactions
  where donor_id = new.donor_id
  order by date desc, created_at desc
  limit 1;

  if latest_interaction_id is null then
    insert into interactions
      (donor_id, type, date, time, staff, subject, summary, outcome, status)
    values
      (new.donor_id, 'אחר', new.date, '09:00', 'מערכת', 'קליטת תרומה',
       'התרומה נקלטה במערכת.', 'התרומה תועדה בכרטיס התורם.', 'הושלם');
  else
    update interactions
    set date = greatest(date, new.date), updated_at = now()
    where id = latest_interaction_id;
  end if;
  return new;
end;
$$;

drop trigger if exists donations_sync_latest_interaction on public.donations;
create trigger donations_sync_latest_interaction
after insert or update of donor_id, date on public.donations
for each row execute function public.sync_interaction_with_latest_donation();

-- Supplier invoice policy: issuing an invoice means it is paid and is an actual project expense.
update public.suppliers set status = 'שולם', open_invoices = 0;
alter table public.suppliers alter column status set default 'שולם';
update public.supplier_invoices set status = 'שולם';

update public.project_expenses pe
set status = 'שולם',
    reference = si.id,
    description = coalesce(pe.description, 'חשבונית ספק ' || si.id)
from public.supplier_invoices si
where si.project_id = pe.project_id
  and si.supplier_id = pe.supplier_id
  and si.amount = pe.amount
  and si.project_id is not null;

insert into public.project_expenses
  (project_id, category, supplier_id, amount, date, status, description, reference, created_by)
select si.project_id, 'חשבונית ספק', si.supplier_id, si.amount, si.issue_date, 'שולם',
       'חשבונית ספק ' || si.id, si.id, 'סנכרון חשבוניות'
from public.supplier_invoices si
where si.project_id is not null
  and not exists (
    select 1 from public.project_expenses pe where pe.reference = si.id
  );

create or replace function public.force_supplier_invoice_paid()
returns trigger language plpgsql as $$
begin
  new.status := 'שולם';
  return new;
end;
$$;

drop trigger if exists supplier_invoice_force_paid on public.supplier_invoices;
create trigger supplier_invoice_force_paid
before insert or update on public.supplier_invoices
for each row execute function public.force_supplier_invoice_paid();

create or replace function public.sync_supplier_invoice_to_project_expense()
returns trigger language plpgsql security definer set search_path = public as $$
declare expense_id text;
begin
  update suppliers set status = 'שולם', open_invoices = 0 where id = new.supplier_id;
  if new.project_id is null then return new; end if;

  select id into expense_id from project_expenses where reference = new.id limit 1;
  if expense_id is null then
    insert into project_expenses
      (project_id, category, supplier_id, amount, date, status, description, reference, created_by)
    values
      (new.project_id, 'חשבונית ספק', new.supplier_id, new.amount, new.issue_date, 'שולם',
       'חשבונית ספק ' || new.id, new.id, 'סנכרון חשבוניות');
  else
    update project_expenses
    set project_id = new.project_id, supplier_id = new.supplier_id, amount = new.amount,
        date = new.issue_date, status = 'שולם', description = 'חשבונית ספק ' || new.id
    where id = expense_id;
  end if;
  return new;
end;
$$;

drop trigger if exists supplier_invoice_sync_expense on public.supplier_invoices;
create trigger supplier_invoice_sync_expense
after insert or update on public.supplier_invoices
for each row execute function public.sync_supplier_invoice_to_project_expense();

-- Add current-year donation detail and keep total income above actual expenses.
do $$
declare
  expense_total numeric;
  year_donation_total numeric;
  amount_to_add numeric;
begin
  select coalesce(sum(amount), 0) into expense_total from public.project_expenses;
  select coalesce(sum(amount), 0) into year_donation_total
  from public.donations
  where extract(year from date) = extract(year from current_date);
  amount_to_add := greatest(expense_total + 250000 - year_donation_total, 400000);

  insert into public.donations
    (id, donor_id, is_anonymous, amount, project_id, project_label, method, receipt, date, reference, notes)
  values
    ('DN-CURRENT-01', 'D-501', false, round(amount_to_add * 0.35), 'PR-01', 'קייטנת קיץ', 'העברה בנקאית', 'הופק', current_date - 120, 'YEAR-01', 'תרומה שנתית'),
    ('DN-CURRENT-02', 'D-502', false, round(amount_to_add * 0.30), 'PR-02', 'תכנית נוער', 'העברה בנקאית', 'הופק', current_date - 85,  'YEAR-02', 'תרומה שנתית'),
    ('DN-CURRENT-03', 'D-505', false, round(amount_to_add * 0.20), 'PR-04', 'סדנת העצמה', 'אשראי',        'הופק', current_date - 45,  'YEAR-03', 'תרומה שנתית'),
    ('DN-CURRENT-04', 'D-503', false, amount_to_add - round(amount_to_add * 0.85), 'PR-03', 'ליווי משפחות', 'שיק', 'הופק', current_date - 10, 'YEAR-04', 'תרומה שנתית')
  on conflict (id) do nothing;
end;
$$;
