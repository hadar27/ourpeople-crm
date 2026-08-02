// Editable record store for the Our People ERP/CRM.
// Holds the mutable copy of every core collection plus a full audit trail, so
// profile pages and tables re-render immediately after an edit while keeping the
// original record id. Each collection mirrors a future database table.
import { useSyncExternalStore } from "react";
import {
  donations as seedDonations,
  donors as seedDonors,
  participants as seedParticipants,
  projects as seedProjects,
  suppliers as seedSuppliers,
  users as seedUsers,
  volunteers as seedVolunteers,
  type Donation,
  type Donor,
  type Participant,
  type Project,
  type Supplier,
  type User,
  type Volunteer,
} from "./mock-data";
import { getCurrentUser } from "./permissions";

// ---------- Record shapes (extended with editable detail fields) ----------
export type ParticipantRecord = Participant & {
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
};

export type VolunteerRecord = Volunteer & {
  phone?: string;
  email?: string;
  notes?: string;
};

export type DonorRecord = Donor & {
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  preferredChannel?: string;
  notes?: string;
};

export type DonationRecord = Donation & {
  reference?: string;
  notes?: string;
};

export type ProjectRecord = Project & {
  description?: string;
  startDate?: string;
  endDate?: string;
  requiredVolunteers?: number;
  suppliers?: string;
  notes?: string;
};

export type SupplierRecord = Supplier & {
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
};

export type UserRecord = User & { permissions?: string };

export type IncomeRecord = {
  id: string;
  category: string;
  source: string;
  amount: number;
  date: string;
  donationId?: string;
  project?: string;
  method?: string;
  reference?: string;
  notes?: string;
};

export type ExpenseRecord = {
  id: string;
  category: string;
  amount: number;
  date: string;
  supplier?: string;
  project: string;
  status: string;
  receiptStatus?: string;
  reference?: string;
  notes?: string;
};

export type AuditChange = { field: string; from: string; to: string };
export type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  actor: string;
  at: string;
  changes: AuditChange[];
};

type Collections = {
  participants: ParticipantRecord[];
  volunteers: VolunteerRecord[];
  donors: DonorRecord[];
  donations: DonationRecord[];
  projects: ProjectRecord[];
  suppliers: SupplierRecord[];
  users: UserRecord[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
};

type State = Collections & { audit: AuditEntry[] };

export const seedIncomes: IncomeRecord[] = [
  { id: "IN-1", category: "תרומה", source: "תרומה — קרן הירש", amount: 50000, date: "2025-05-12", donationId: "DN-9001", project: "קייטנת קיץ 2025", method: "העברה בנקאית", reference: "REF-10021" },
  { id: "IN-2", category: "תרומה", source: "תרומה — חברת טכנולגיה", amount: 80000, date: "2025-04-28", donationId: "DN-9002", project: "תכנית נוער", method: "העברה בנקאית", reference: "REF-10022" },
  { id: "IN-3", category: "תרומה", source: 'תרומה — קרן "אור"', amount: 120000, date: "2025-05-10", donationId: "DN-9005", project: "סדנת העצמה לנשים", method: "העברה בנקאית", reference: "REF-10023" },
  { id: "IN-4", category: "אגרות נרשמים", source: "אגרות נרשמים", amount: 24800, date: "2025-05-18", project: "כללי", method: "אשראי", reference: "REF-10024" },
];

export const seedExpenses: ExpenseRecord[] = [
  { id: "EX-1", category: "שכר ותפעול", amount: 84200, project: "כללי", date: "2025-05-10", status: "שולם", receiptStatus: "חשבונית התקבלה", reference: "INV-4410" },
  { id: "EX-2", category: "הסעות", amount: 12300, project: "קייטנת קיץ 2025", date: "2025-05-12", status: "שולם", supplier: 'הסעות "דרך"', receiptStatus: "חשבונית התקבלה", reference: "INV-4411" },
  { id: "EX-3", category: "קייטרינג", amount: 18900, project: "סדנת העצמה לנשים", date: "2025-05-14", status: "ממתין", supplier: "קייטרינג בית חם", receiptStatus: "חסרה חשבונית", reference: "INV-4412" },
  { id: "EX-4", category: "ערכות חירום", amount: 32400, project: "חירום ושיקום", date: "2025-05-15", status: "שולם", receiptStatus: "חשבונית התקבלה", reference: "INV-4413" },
  { id: "EX-5", category: "פרסום ושיווק", amount: 6700, project: "כללי", date: "2025-05-16", status: "ממתין", receiptStatus: "חסרה חשבונית", reference: "INV-4414" },
];

let state: State = {
  participants: seedParticipants.map((p) => ({ ...p })),
  volunteers: seedVolunteers.map((v) => ({ ...v })),
  donors: seedDonors.map((d) => ({ ...d })),
  donations: seedDonations.map((d) => ({ ...d })),
  projects: seedProjects.map((p) => ({ ...p })),
  suppliers: seedSuppliers.map((s) => ({ ...s })),
  users: seedUsers.map((u) => ({ ...u })),
  incomes: seedIncomes.map((i) => ({ ...i })),
  expenses: seedExpenses.map((e) => ({ ...e })),
  audit: [],
};

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emit() {
  listeners.forEach((l) => l());
}

export function getRecordsState() {
  return state;
}

/** Read a slice of the store. Selectors must return stable references. */
function useSlice<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export type CollectionKey = keyof Collections;

/** Live collection — reference stays stable until that collection changes. */
export function useCollection<K extends CollectionKey>(key: K): Collections[K] {
  return useSlice((s) => s[key]);
}

/** Live single record by its real id, or undefined when missing. */
export function useRecord<K extends CollectionKey>(
  key: K,
  id: string | undefined,
): Collections[K][number] | undefined {
  return useSlice((s) => (s[key] as { id: string }[]).find((r) => r.id === id)) as
    | Collections[K][number]
    | undefined;
}

let auditCounter = 1;

function fmt(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "כן" : "לא";
  return String(v);
}

/**
 * Merge a patch into an existing record (id preserved, never duplicated) and
 * append an audit entry describing every changed field.
 */
export function updateRecord<K extends CollectionKey>(
  key: K,
  id: string,
  patch: Partial<Collections[K][number]>,
  labels: Record<string, string> = {},
  entityLabel = key,
): { ok: boolean; error?: string } {
  const list = state[key] as { id: string }[];
  const current = list.find((r) => r.id === id) as Record<string, unknown> | undefined;
  if (!current) return { ok: false, error: "הרשומה לא נמצאה — ייתכן שנמחקה." };

  const changes: AuditChange[] = [];
  for (const [field, value] of Object.entries(patch as Record<string, unknown>)) {
    if (fmt(current[field]) !== fmt(value)) {
      changes.push({ field: labels[field] ?? field, from: fmt(current[field]), to: fmt(value) });
    }
  }
  if (changes.length === 0) return { ok: true };

  const nextList = list.map((r) => (r.id === id ? { ...r, ...patch, id } : r));
  const entry: AuditEntry = {
    id: `AU-${Date.now().toString(36)}${auditCounter++}`,
    entityType: entityLabel,
    entityId: id,
    actor: getCurrentUser().name,
    at: new Date().toISOString(),
    changes,
  };
  state = { ...state, [key]: nextList, audit: [entry, ...state.audit] } as State;
  emit();
  return { ok: true };
}

/** Log an audit entry for records living in other stores (interactions, families). */
export function logAudit(entityLabel: string, id: string, changes: AuditChange[]) {
  if (changes.length === 0) return;
  const entry: AuditEntry = {
    id: `AU-${Date.now().toString(36)}${auditCounter++}`,
    entityType: entityLabel,
    entityId: id,
    actor: getCurrentUser().name,
    at: new Date().toISOString(),
    changes,
  };
  state = { ...state, audit: [entry, ...state.audit] };
  emit();
}

export function diffValues(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  labels: Record<string, string> = {},
): AuditChange[] {
  const changes: AuditChange[] = [];
  for (const [field, value] of Object.entries(after)) {
    if (fmt(before[field]) !== fmt(value)) {
      changes.push({ field: labels[field] ?? field, from: fmt(before[field]), to: fmt(value) });
    }
  }
  return changes;
}

// ---------- Audit selectors (memoized for stable snapshots) ----------
const auditCache = new Map<string, (s: State) => AuditEntry[]>();
function auditSelector(cacheKey: string, filter: (e: AuditEntry) => boolean) {
  const cached = auditCache.get(cacheKey);
  if (cached) return cached;
  let lastAudit: AuditEntry[] | undefined;
  let lastValue: AuditEntry[] = [];
  const fn = (s: State) => {
    if (lastAudit !== s.audit) {
      lastAudit = s.audit;
      lastValue = s.audit.filter(filter);
    }
    return lastValue;
  };
  auditCache.set(cacheKey, fn);
  return fn;
}

/** Change history for one record ("היסטוריית שינויים"). */
export function useAuditTrail(entityId: string | undefined): AuditEntry[] {
  const selector = auditSelector(`rec:${entityId}`, (e) => e.entityId === entityId);
  return useSlice(selector);
}

/** Change history for a whole module. */
export function useModuleAudit(entityLabel: string): AuditEntry[] {
  const selector = auditSelector(`mod:${entityLabel}`, (e) => e.entityType === entityLabel);
  return useSlice(selector);
}
