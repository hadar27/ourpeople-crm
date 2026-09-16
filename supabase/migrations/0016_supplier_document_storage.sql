alter table public.documents
  add column if not exists storage_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated_read_documents" on storage.objects;
create policy "authenticated_read_documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents');

drop policy if exists "authenticated_upload_documents" on storage.objects;
create policy "authenticated_upload_documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents');

drop policy if exists "authenticated_delete_documents" on storage.objects;
create policy "authenticated_delete_documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents');
