// In-memory reactive store for CRM/ERP records that the UI can create and update.
// Every collection is keyed by id and mirrors a future database table, so the
// read/write API here can be swapped for real queries without touching the UI.
import { useSyncExternalStore } from "react";
import type {
  ActivityEntry,
  AssistanceRecord,
  BeneficiaryFamily,
  DonationAllocation,
  DonorInteraction,
  EntityDocument,
  FamilyMember,
  FollowUpTask,
  PurchaseOrder,
  SupplierContract,
  SupplierInvoice,
  SupplierPayment,
} from "./crm-types";
import {
  seedActivity,
  seedAllocations,
  seedAssistance,
  seedContracts,
  seedDocuments,
  seedFamilies,
  seedFamilyMembers,
  seedFollowUps,
  seedInteractions,
  seedPOs,
  seedSupplierInvoices,
  seedSupplierPayments,
} from "./crm-seed";

type State = {
  interactions: DonorInteraction[];
  followUps: FollowUpTask[];
  contracts: SupplierContract[];
  purchaseOrders: PurchaseOrder[];
  supplierInvoices: SupplierInvoice[];
  supplierPayments: SupplierPayment[];
  documents: EntityDocument[];
  activity: ActivityEntry[];
  families: BeneficiaryFamily[];
  familyMembers: FamilyMember[];
  assistance: AssistanceRecord[];
  allocations: DonationAllocation[];
};

let state: State = {
  interactions: seedInteractions,
  followUps: seedFollowUps,
  contracts: seedContracts,
  purchaseOrders: seedPOs,
  supplierInvoices: seedSupplierInvoices,
  supplierPayments: seedSupplierPayments,
  documents: seedDocuments,
  activity: seedActivity,
  families: seedFamilies,
  familyMembers: seedFamilyMembers,
  assistance: seedAssistance,
  allocations: seedAllocations,
};

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emit() {
  listeners.forEach((l) => l());
}
function getState() {
  return state;
}

/** Subscribe to a slice of the store. The selector must return a stable reference. */
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

let counter = 1;
export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).slice(-4)}${counter++}`.toUpperCase();
}

function patch(next: Partial<State>) {
  state = { ...state, ...next };
  emit();
}

// ---------- Donor CRM ----------
export function addInteraction(rec: DonorInteraction) {
  patch({ interactions: [rec, ...state.interactions] });
}

export function setInteractionStatus(id: string, status: DonorInteraction["status"]) {
  patch({
    interactions: state.interactions.map((i) => (i.id === id ? { ...i, status } : i)),
  });
}

export function addFollowUp(task: FollowUpTask) {
  patch({ followUps: [task, ...state.followUps] });
}

export function completeFollowUp(id: string) {
  patch({ followUps: state.followUps.map((f) => (f.id === id ? { ...f, status: "הושלם" } : f)) });
}

// ---------- Families ----------
export function addFamily(fam: BeneficiaryFamily) {
  patch({ families: [fam, ...state.families] });
}

export function addFamilyMember(m: FamilyMember) {
  patch({ familyMembers: [...state.familyMembers, m] });
}

export function addAssistance(rec: AssistanceRecord) {
  patch({ assistance: [rec, ...state.assistance] });
}

export function setAssistanceStatus(id: string, status: AssistanceRecord["status"]) {
  patch({ assistance: state.assistance.map((a) => (a.id === id ? { ...a, status } : a)) });
}

// ---------- Donation allocation ----------
export function addAllocation(rec: DonationAllocation) {
  patch({ allocations: [...state.allocations, rec] });
}

export function removeAllocation(id: string) {
  patch({ allocations: state.allocations.filter((a) => a.id !== id) });
}

// ---------- Activity log ----------
export function logActivity(entry: ActivityEntry) {
  patch({ activity: [entry, ...state.activity] });
}

// ---------- Selectors ----------
// useSyncExternalStore requires a *stable* snapshot reference: a selector that
// builds a new array/object on every call causes an infinite render loop.
// memoSelector caches the last computed value per (state, cacheKey) pair.
function memoSelector<T>(key: string, compute: (s: State) => T) {
  let lastState: State | undefined;
  let lastValue: T;
  const cached = selectorCache.get(key) as ((s: State) => T) | undefined;
  if (cached) return cached;
  const fn = (s: State): T => {
    if (lastState !== s) {
      lastState = s;
      lastValue = compute(s);
    }
    return lastValue;
  };
  selectorCache.set(key, fn as (s: State) => unknown);
  return fn;
}

const selectorCache = new Map<string, (s: State) => unknown>();

export const selectInteractions = (donorId: string) =>
  memoSelector(`interactions:${donorId}`, (s) => s.interactions.filter((i) => i.donorId === donorId));

export const selectSupplierBundle = (supplierId: string) =>
  memoSelector(`supplier:${supplierId}`, (s) => ({
    contracts: s.contracts.filter((c) => c.supplierId === supplierId),
    purchaseOrders: s.purchaseOrders.filter((p) => p.supplierId === supplierId),
    invoices: s.supplierInvoices.filter((i) => i.supplierId === supplierId),
    payments: s.supplierPayments.filter((p) => p.supplierId === supplierId),
    documents: s.documents.filter((d) => d.entityType === "supplier" && d.entityId === supplierId),
    activity: s.activity.filter((a) => a.entityType === "supplier" && a.entityId === supplierId),
  }));

export const selectFamilyBundle = (familyId: string) =>
  memoSelector(`family:${familyId}`, (s) => ({
    members: s.familyMembers.filter((m) => m.familyId === familyId),
    assistance: s.assistance.filter((a) => a.familyId === familyId),
    documents: s.documents.filter((d) => d.entityType === "family" && d.entityId === familyId),
    followUps: s.followUps.filter((f) => f.entityType === "family" && f.entityId === familyId),
  }));

export const selectAllocations = (donationId: string) =>
  memoSelector(`allocations:${donationId}`, (s) =>
    s.allocations.filter((a) => a.donationId === donationId),
  );


export function getSnapshot() {
  return state;
}
