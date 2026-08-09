# Supabase Migration Progress

Tracking the migration of this app off its in-memory mock stores (`src/lib/records-store.ts`, `src/lib/store.ts`) onto real Supabase tables. Architecture: direct-from-browser `supabase-js` client (no custom backend), RLS with `to authenticated` policies, explicit `GRANT`s on every table, react-query data-access hooks in `src/lib/queries/*.ts` mirroring the pattern established by `queries/suppliers.ts`.

Full schema lives in `supabase/migrations/0001_full_migration.sql`.

## Done

**Auth** — Real Supabase Auth (`src/lib/auth.ts`, `src/lib/supabase.ts`). Login/logout work, routes are session-gated via `src/components/app-shell.tsx`. Env vars: `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (see `.env.example`).

**Suppliers module** (pilot) — `queries/suppliers.ts`, `_app.suppliers.tsx`, `_app.suppliers_.$supplierId.tsx`. Full CRUD.

**Change-history / audit-trail feature** — removed entirely, including `updateRecord`'s diff machinery and every `*Labels` export in `edit-forms.ts`.

**Phase 1 — core entities** (`queries/{activities,donors,projects,participants,volunteers,users,donations,incomes,expenses}.ts`): all 8 records-store.ts collections migrated to real CRUD, including previously-broken "add" dialogs that were no-op stubs. New `activities` table replaces the old free-text activity fields. `records-store.ts` deleted.

**Phase 2 — relational entities** (`queries/{families,family-members,assistance,interactions,follow-ups,allocations}.ts`): families, family members, assistance requests, donor interactions, follow-up tasks, and donation↔project allocations (the app's only hard-delete path) all migrated.

**Phase 3 — read-only migration** (`queries/{contracts,purchase-orders,supplier-invoices,supplier-payments,documents,activity-log,tasks,project-expenses,project-phases}.ts`): contracts, purchase orders, supplier invoices/payments and the activity/document timelines on the supplier and family detail pages, the Kanban tasks board (`_app.projects.tsx`, `_app.project.$id.tsx`), and project expenses/Gantt phases all now read live Supabase data instead of `store.ts`'s bundles or `mock-data.ts` maps. No new create/edit UI was added for these — read-only, as scoped. Project/supplier name labels on these records are resolved via embedded Supabase joins (e.g. `*, projects(name)`) rather than mock-data lookups.

**Phase 4 — cleanup**: `business-rules.ts`'s five `getSnapshot()` reads (interactions/followUps/families/assistance/allocations) now read the static `crm-seed.ts` arrays directly, freezing them at seed values. `src/lib/store.ts` deleted (no remaining dependents). Pruned from `src/lib/mock-data.ts`: `Participant`/`participants`, `Donor`/`donors`, `Task`/`tasks`, `ProjectExpenseLine`/`projectExpenses`, `GanttPhase`/`projectPhases`, `activitiesCatalog`, `isValidIsraeliId`/`isValidPhone` — all fully superseded and unreferenced. Kept: `projects`/`volunteers`/`donations`/`suppliers` (still read statically by `business-rules.ts`), `users` (mocked signed-in user in `permissions.ts`), `alerts`/`monthlyDonations`/`budgetVsActual`/`projectMix`/`projectParticipantCounts`/`permissionsMatrix`/`reportsCatalog` (already-deferred, per below), plus the `Supplier`/`Alert`/`User` types still referenced elsewhere.

Typecheck (`tsc --noEmit`) is clean. `npm run lint` reports pre-existing `prettier/prettier` formatting debt across the whole repo (including files untouched by this migration) — not introduced by this work and out of scope to fix here. `npm run build` fails in this sandbox on a pre-existing Node.js version mismatch (Node 20.9 vs. Vite's required 20.19+/22.12+), also unrelated to this migration.

## Deferred by explicit decision (not a gap to fix later without discussion)

Dashboard charts, the reports page, and `business-rules.ts`'s alert engine intentionally keep reading static/frozen mock data rather than live Supabase queries — rewiring them was scoped out as a separate future pass, not part of this migration.

## Next steps

None outstanding from this migration plan — all four phases are complete. Any further work (dashboard/reports live-wiring, upgrading the sandbox Node/Vite versions) would be a new, separately-scoped effort.
