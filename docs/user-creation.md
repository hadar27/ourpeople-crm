# Adding staff users

The Users and Permissions screen includes an Add User dialog for an active
NGO director or system administrator. Name, email, role, password (at least
8 characters), and password confirmation are required. New accounts are active.
The administrator gives the chosen login details to the user; this flow does
not send an invitation email.

The server validates the caller's Supabase access token, then loads the caller's
current role and status from public.users before using the Auth Admin API.
The account's Auth UUID is also used as public.users.id. If profile insertion
fails, the new Auth account is deleted; a failed deletion triggers a ban attempt.
Passwords are passed only to Supabase Auth and are never saved in public.users.

## Deployment configuration

Set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in the server environment
on Vercel. Do not prefix this key with VITE_ or expose it to the browser.
SUPABASE_URL is optional when VITE_SUPABASE_URL is already configured.
Redeploy after changing environment variables.

No new SQL migration is needed. This feature uses the existing migrations:
0003_users_auth_link.sql, 0004_grant_service_role_users.sql,
0005_role_privileges.sql, and 0024_project_approval_and_roles.sql.
Do not rerun the historical auth-link migration on an existing system:
it contains deletion of old demo users.

Run the server authorization and rollback checks with:

```sh
node --test tests/create-user.test.mjs
```
