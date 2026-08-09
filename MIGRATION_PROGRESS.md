# Supabase Migration Progress

Tracking the migration of this app off its in-memory mock stores (`src/lib/records-store.ts`, `src/lib/store.ts`) onto real Supabase tables. Architecture: direct-from-browser `supabase-js` client (no custom backend), RLS with `to authenticated` policies, explicit `GRANT`s on every table, react-query data-access hooks in `src/lib/queries/*.ts` mirroring the pattern established by `queries/suppliers.ts`.

Full schema lives in `supabase/migrations/0001_full_migration.sql`. Design rationale and phase plan: `.claude/plans/binary-weaving-hammock.md`.

## Done

**Auth** — Real Supabase Auth (`src/lib/auth.ts`, `src/lib/supabase.ts`). Login/logout work, routes are session-gated via `src/components/app-shell.tsx`. Env vars: `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (see `.env.example`).

**Suppliers module** (pilot) — `queries/suppliers.ts`, `_app.suppliers.tsx`, `_app.suppliers_.$supplierId.tsx`. Full CRUD.

**Change-history / audit-trail feature** — removed entirely, including `updateRecord`'s diff machinery and every `*Labels` export in `edit-forms.ts`.

**Phase 1 — core entities** (`queries/{activities,donors,projects,participants,volunteers,users,donations,incomes,expenses}.ts`): all 8 records-store.ts collections migrated to real CRUD, including previously-broken "add" dialogs that were no-op stubs. New `activities` table replaces the old free-text activity fields. `records-store.ts` deleted.

**Phase 2 — relational entities** (`queries/{families,family-members,assistance,interactions,follow-ups,allocations}.ts`): families, family members, assistance requests, donor interactions, follow-up tasks, and donation↔project allocations (the app's only hard-delete path) all migrated. `store.ts` is now scoped down to exactly its Phase 3 remainder.

Typecheck and lint are clean as of this point.

**Git status**: Phase 1 is committed (`phase1`). **Phase 2 changes are uncommitted** — commit before further work if you want it preserved.

## Deferred by explicit decision (not a gap to fix later without discussion)

Dashboard charts, the reports page, and `business-rules.ts`'s alert engine intentionally keep reading static/frozen mock data rather than live Supabase queries — rewiring them was scoped out as a separate future pass, not part of this migration.

## Next steps

**Phase 3 — read-only migration** (no new create/edit UI, just move data + swap reads):
- Contracts, purchase orders, supplier invoices/payments — bundle used by `_app.suppliers_.$supplierId.tsx` via `store.ts`'s `selectSupplierBundle`.
- Documents, activity log — used by both the supplier detail page and `_app.families_.$id.tsx`'s documents tab.
- Kanban tasks board — `_app.projects.tsx`, currently reading `tasks` from `mock-data.ts`.
- Project expenses / Gantt phases — `_app.project.$id.tsx`, currently reading `projectExpenses`/`projectPhases` maps from `mock-data.ts`.

**Phase 4 — cleanup** (after Phase 3):
- Repoint `business-rules.ts`'s five live `getSnapshot()` reads (interactions/followUps/families/assistance/allocations) at the static `crm-seed.ts` arrays instead — freezes them at seed values (matching the already-accepted staleness elsewhere) so `store.ts` has no remaining dependents.
- Delete `src/lib/store.ts`.
- Prune the now-superseded seed arrays from `src/lib/mock-data.ts` (participants, volunteers, donors, donations, projects, users, tasks, suppliers) — but keep `projects`/`volunteers`/`donations`/`suppliers` if `business-rules.ts` still reads them statically, plus everything already deferred (`alerts`, `monthlyDonations`, `budgetVsActual`, `projectMix`, `projectParticipantCounts`, `permissionsMatrix`, `reportsCatalog`) and any validators/types still in use.

Recommend starting a fresh chat for Phase 3, pointing it at this file plus the plan file for context.
