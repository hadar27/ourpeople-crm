-- Allow uploaded documents to be linked to registrants and volunteers.
alter table public.documents
  drop constraint if exists documents_entity_type_check;

alter table public.documents
  add constraint documents_entity_type_check
  check (entity_type in ('supplier', 'family', 'donor', 'participant', 'volunteer'));
