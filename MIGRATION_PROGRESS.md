# Supabase Migration Progress

Tracking the migration of this app off its in-memory mock stores (`src/lib/records-store.ts`, `src/lib/store.ts`, `src/lib/mock-data.ts`) onto real Supabase tables. Architecture: direct-from-browser `supabase-js` client (no custom backend), RLS with `to authenticated` policies, explicit `GRANT`s on every table, react-query data-access hooks in `src/lib/queries/*.ts` mirroring the pattern established by `queries/suppliers.ts`.

Full schema lives in `supabase/migrations/0001_full_migration.sql`.

## ⚠️ Important: never commit package-lock.json

This project's package manager is **bun** (`bun.lock`). `package-lock.json` is an npm artifact that shows up whenever `npm`/`npx` gets invoked in this repo (it has happened before — see commit `8b3d659 remove package.lock`). **Always check for and remove `package-lock.json` before committing** — never let it get staged or committed. It is not gitignored, so `git status`/`git add -A` will happily pick it up if you're not careful.

## Done

**Auth** — Real Supabase Auth (`src/lib/auth.ts`, `src/lib/supabase.ts`). Login/logout work, routes are session-gated via `src/components/app-shell.tsx`. Env vars: `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (see `.env.example`).

**Suppliers module** (pilot) — `queries/suppliers.ts`, `_app.suppliers.tsx`, `_app.suppliers_.$supplierId.tsx`. Full CRUD.

**Change-history / audit-trail feature** — removed entirely, including `updateRecord`'s diff machinery and every `*Labels` export in `edit-forms.ts`.

**Phase 1 — core entities** (`queries/{activities,donors,projects,participants,volunteers,users,donations,incomes,expenses}.ts`): all 8 records-store.ts collections migrated to real CRUD, including previously-broken "add" dialogs that were no-op stubs. New `activities` table replaces the old free-text activity fields. `records-store.ts` deleted.

**Phase 2 — relational entities** (`queries/{families,family-members,assistance,interactions,follow-ups,allocations}.ts`): families, family members, assistance requests, donor interactions, follow-up tasks, and donation↔project allocations (the app's only hard-delete path) all migrated.

**Phase 3 — read-only migration** (`queries/{contracts,purchase-orders,supplier-invoices,supplier-payments,documents,activity-log,tasks,project-expenses,project-phases}.ts`): contracts, purchase orders, supplier invoices/payments and the activity/document timelines on the supplier and family detail pages, the Kanban tasks board (`_app.projects.tsx`, `_app.project.$id.tsx`), and project expenses/Gantt phases all now read live Supabase data instead of `store.ts`'s bundles or `mock-data.ts` maps. No new create/edit UI was added for these — read-only, as scoped. Project/supplier name labels on these records are resolved via embedded Supabase joins (e.g. `*, projects(name)`) rather than mock-data lookups.

**Phase 4 — cleanup**: `business-rules.ts`'s five `getSnapshot()` reads (interactions/followUps/families/assistance/allocations) now read the static `crm-seed.ts` arrays directly, freezing them at seed values. `src/lib/store.ts` deleted (no remaining dependents). Pruned from `src/lib/mock-data.ts`: `Participant`/`participants`, `Donor`/`donors`, `Task`/`tasks`, `ProjectExpenseLine`/`projectExpenses`, `GanttPhase`/`projectPhases`, `activitiesCatalog`, `isValidIsraeliId`/`isValidPhone` — all fully superseded and unreferenced.

**Phase 5 — alert engine, dashboard, reports live-wiring, and full `mock-data.ts` removal**:
- `business-rules.ts`'s `generateAlerts()` is now a pure function fed by a new `useAlerts()` hook that pulls live data via react-query (`useProjects`, `useVolunteers`, `useDonations`, `useSuppliers`, `useFamilies`, plus three new "fetch-all" hooks added for this: `useAllInteractions`, `useAllFollowUps`, `useAllAllocations` in their respective `queries/*.ts` files, mirroring the existing `useAllAssistance`). Wired into `app-shell.tsx`, `_app.alerts.tsx`, `_app.dashboard.tsx`.
- `_app.dashboard.tsx` — stat cards, the donation trend chart, budget-vs-actual chart, and the recent-donations table now compute from live data. The "project mix by audience" donut was **removed** (no DB-backed grouping exists for it — dropped rather than fabricated a category scheme).
- `_app.reports.tsx` — dropped the "Impact score" and "annual fundraising goal" stat cards, the month×activity-type heat map, and the entire "Report Center" catalog section (~28 canned report defs with fabricated `lastRun`/`scheduled` metadata, export/schedule buttons that were already just `toast` stubs with no backend) — none had real data behind them. Kept and live-wired: total volunteer hours, donor/repeat-donor counts, and the donation-trend/budget-vs-actual charts (via a new shared helper, `src/lib/dashboard-metrics.ts`).
- `_app.finance.tsx` — its `budgetVsActual`/`monthlyDonations` chart data now derives from live `useProjects()`/`useDonations()` via the same `dashboard-metrics.ts` helper (its four stat cards were **not** touched and remain hardcoded placeholders — see Deferred below).
- `_app.project.$id.tsx` — donations now filter by the real `donations.project_id` FK instead of fuzzy name-matching (an actual correctness improvement); volunteers still use fuzzy name-matching (no FK exists — see Deferred below).
- `_app.families_.$id.tsx`, `_app.volunteer.$id.tsx`, `_app.participants_.$participantId.tsx` — swapped the static `projects` mock array for `useProjects()`.
- `module-edit-dialogs.tsx` — dropped a stray `Supplier` type import from mock-data in favor of `SupplierRecord`.
- `src/lib/permissions.ts` — `useCurrentUser()`/`useCanEdit()` now resolve the signed-in user by matching the real Supabase Auth session's email against live `useUsers()` data, instead of hardcoding `users[0]`. Note: edit buttons are briefly hidden while the session/users query is still loading (fail-closed) — a real behavior change from before, when everything was visible immediately.
- `_app.users.tsx` — dropped the static `permissionsMatrix` display grid (it was a second, inconsistent source of truth alongside the real `ROLE_EDIT_MATRIX` that actually gates edit buttons).
- **`src/lib/mock-data.ts` deleted entirely.** `Alert`/`alerts` and `projectMix` were deleted as part of the dashboard/alert-engine work (orphaned once nothing imported them); everything else was migrated per the above and the file had zero remaining consumers.

Typecheck (`tsc --noEmit`) is clean. `npm run lint` reports pre-existing `prettier/prettier` formatting debt across the whole repo (including files untouched by this migration) — not introduced by this work and out of scope to fix here. `npm run build` fails in this sandbox on a pre-existing Node.js version mismatch (Node 20.9 vs. Vite's required 20.19+/22.12+), also unrelated to this migration.

## Deferred by explicit decision (not a gap to fix later without discussion)

- **`_app.project.$id.tsx`'s participant count** — still a hardcoded `PARTICIPANT_COUNTS_BY_PROJECT` placeholder (relocated from `mock-data.ts` into the route file itself). Participants link to `activities`, not `projects` — there's no real FK to count against today. **Planned follow-up**: drop the `activities` table entirely and link `participants`/`volunteers` directly to `projects`; once that lands, replace this placeholder (and the fuzzy `project.name.includes(...)` matching used for volunteers on this page and on `_app.volunteer.$id.tsx`/`_app.participants_.$participantId.tsx`) with real queries.
- **`_app.finance.tsx`'s four stat cards** (הכנסות השנה, הוצאות השנה, תזרים נקי, חשבוניות פתוחות) remain hardcoded placeholder values — the same class of fabricated-number issue already cleaned up on the dashboard and reports pages, just not in scope for this pass.

## Next steps

None outstanding from this migration plan as scoped. Candidates for a future pass: the activities→projects schema change described above, finance.tsx's remaining hardcoded stat cards, and upgrading the sandbox Node/Vite versions so `npm run build` can actually be verified here.
