// Reusable CRM / ERP entity types for the Our People platform.
// These mirror the intended database schema — every field maps 1:1 to a column,
// so the in-memory store (src/lib/store.ts) can be swapped for real queries.

export type InteractionType = "שיחת טלפון" | "פגישה" | 'דוא"ל' | "WhatsApp" | "אחר";
export type InteractionStatus = "פתוח" | "ממתין" | "הושלם";

export type DonorInteraction = {
  id: string;
  donorId: string;
  type: InteractionType;
  /** ISO date, yyyy-mm-dd */
  date: string;
  /** HH:mm */
  time: string;
  staff: string;
  subject: string;
  summary: string;
  outcome: string;
  followUpAction?: string;
  /** ISO date, yyyy-mm-dd */
  followUpDate?: string;
  status: InteractionStatus;
  createdAt: string;
};

export type FollowUpTask = {
  id: string;
  /** entity kind the task belongs to */
  entityType: "donor" | "supplier" | "family";
  entityId: string;
  entityName: string;
  sourceInteractionId?: string;
  title: string;
  dueDate: string;
  assignee: string;
  status: InteractionStatus;
};

// ---------- Supplier profile ----------
export type SupplierContract = {
  id: string;
  supplierId: string;
  title: string;
  projectId?: string;
  value: number;
  startDate: string;
  endDate: string;
  status: "בתוקף" | "הסתיים" | "בטיוטה";
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  projectId?: string;
  description: string;
  amount: number;
  date: string;
  status: "מאושרת" | "ממתין" | "בוטלה";
};

export type SupplierInvoice = {
  id: string;
  supplierId: string;
  projectId?: string;
  poId?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: "שולם" | "ממתין" | "חלקי" | "באיחור";
};

export type SupplierPayment = {
  id: string;
  supplierId: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: "העברה בנקאית" | "שיק" | "אשראי";
};

export type EntityDocument = {
  id: string;
  entityType: "supplier" | "family" | "donor";
  entityId: string;
  name: string;
  kind: string;
  uploadedAt: string;
  uploadedBy: string;
};

export type ActivityEntry = {
  id: string;
  entityType: "supplier" | "family" | "donor";
  entityId: string;
  date: string;
  actor: string;
  action: string;
  detail?: string;
};

// ---------- Beneficiaries & families ----------
export type AssistanceNeed = "מזון" | "דיור" | "תעסוקה" | "חינוך" | "בריאות" | "משפטי" | "ריהוט" | "עברית";
export type FamilyStatus = "בטיפול פעיל" | "ממתינה לאישור" | "מלווה" | "סגורה" | "בסיכון";

export type BeneficiaryFamily = {
  id: string;
  familyName: string;
  mainContact: string;
  phone: string;
  email?: string;
  city: string;
  countryOfOrigin: string;
  /** ISO date */
  immigrationDate: string;
  membersCount: number;
  needs: AssistanceNeed[];
  status: FamilyStatus;
  assignedStaff: string;
  projectId?: string;
  notes?: string;
};

export type FamilyMember = {
  id: string;
  familyId: string;
  name: string;
  relation: "ראש משפחה" | "בן/בת זוג" | "ילד/ה" | "הורה" | "אחר";
  birthYear: number;
  status: "מבוגר" | "קטין" | "סטודנט" | "גמלאי";
  notes?: string;
};

export type AssistanceRecord = {
  id: string;
  familyId: string;
  type: AssistanceNeed;
  description: string;
  amount?: number;
  date: string;
  projectId?: string;
  staff: string;
  status: "אושר" | "ממתין" | "סופק" | "נדחה";
};

// ---------- Donation allocation ----------
export type DonationAllocation = {
  id: string;
  donationId: string;
  projectId: string;
  amount: number;
  date: string;
  notes?: string;
};
