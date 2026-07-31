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
export const selectInteractions = (donorId: string) => (s: State) =>
  s.interactions.filter((i) => i.donorId === donorId);

export const selectSupplierBundle = (supplierId: string) => (s: State) => ({
  contracts: s.contracts.filter((c) => c.supplierId === supplierId),
  purchaseOrders: s.purchaseOrders.filter((p) => p.supplierId === supplierId),
  invoices: s.supplierInvoices.filter((i) => i.supplierId === supplierId),
  payments: s.supplierPayments.filter((p) => p.supplierId === supplierId),
  documents: s.documents.filter((d) => d.entityType === "supplier" && d.entityId === supplierId),
  activity: s.activity.filter((a) => a.entityType === "supplier" && a.entityId === supplierId),
});

export const selectFamilyBundle = (familyId: string) => (s: State) => ({
  members: s.familyMembers.filter((m) => m.familyId === familyId),
  assistance: s.assistance.filter((a) => a.familyId === familyId),
  documents: s.documents.filter((d) => d.entityType === "family" && d.entityId === familyId),
  followUps: s.followUps.filter((f) => f.entityType === "family" && f.entityId === familyId),
});

export const selectAllocations = (donationId: string) => (s: State) =>
  s.allocations.filter((a) => a.donationId === donationId);

export function getSnapshot() {
  return state;
}
