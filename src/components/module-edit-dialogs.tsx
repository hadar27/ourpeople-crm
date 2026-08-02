// Per-module edit buttons. Each one is permission-gated, pre-filled with the
// current record and writes back through the record store (id preserved).
import { RecordEditDialog } from "@/components/record-edit-dialog";
import { useCanEdit } from "@/lib/permissions";
import {
  updateRecord,
  useCollection,
  diffValues,
  logAudit,
  type DonationRecord,
  type DonorRecord,
  type ExpenseRecord,
  type IncomeRecord,
  type ParticipantRecord,
  type ProjectRecord,
  type SupplierRecord,
  type UserRecord,
  type VolunteerRecord,
} from "@/lib/records-store";
import {
  donationFields,
  donationLabels,
  donorFields,
  donorLabels,
  expenseFields,
  expenseLabels,
  familyFields,
  familyLabels,
  incomeFields,
  incomeLabels,
  interactionFields,
  interactionLabels,
  participantFields,
  participantLabels,
  projectFields,
  projectLabels,
  splitList,
  supplierFields,
  supplierLabels,
  userFields,
  userLabels,
  volunteerFields,
  volunteerLabels,
} from "@/lib/edit-forms";
import { selectAllocations, updateFamily, updateInteraction, useStore } from "@/lib/store";
import type {
  AssistanceNeed,
  BeneficiaryFamily,
  DonorInteraction,
  FamilyStatus,
  InteractionStatus,
  InteractionType,
} from "@/lib/crm-types";
import type { Participant, Donation, Donor, Project, Supplier, User, Volunteer } from "@/lib/mock-data";

type Btn = { triggerLabel?: string };

// ---------- Participants ----------
export function ParticipantEditButton({ record, triggerLabel }: { record: ParticipantRecord } & Btn) {
  const allowed = useCanEdit("participants");
  if (!allowed) return null;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת נרשם — ${record.name}`}
      description={`עדכון פרטי הנרשם ${record.id}. המזהה נשמר ולא נוצרת רשומה חדשה.`}
      fields={participantFields}
      sensitiveFields={["paymentStatus"]}
      initialValues={{
        name: record.name,
        idNumber: record.idNumber,
        phone: record.phone,
        email: record.email ?? "",
        address: record.address ?? "",
        city: record.city ?? "",
        activity: record.activity,
        source: record.source,
        status: record.status,
        paymentStatus: record.paymentStatus,
        documentsComplete: record.documentsComplete ? "הושלמו" : "חסרים",
        notes: record.notes ?? "",
      }}
      customValidate={(v) => {
        if (
          record.activityType === "בתשלום" &&
          v.status === "מאושר" &&
          v.paymentStatus !== "שולם"
        ) {
          return "פעילות בתשלום יכולה להיות מאושרת רק לאחר תשלום מלא.";
        }
        return null;
      }}
      onSave={(v) =>
        updateRecord(
          "participants",
          record.id,
          {
            name: v.name,
            idNumber: v.idNumber,
            phone: v.phone,
            email: v.email || undefined,
            address: v.address || undefined,
            city: v.city || undefined,
            activity: v.activity,
            source: v.source as Participant["source"],
            status: v.status as Participant["status"],
            paymentStatus: v.paymentStatus as Participant["paymentStatus"],
            documentsComplete: v.documentsComplete === "הושלמו",
            notes: v.notes || undefined,
          },
          participantLabels,
          "נרשם",
        )
      }
    />
  );
}

// ---------- Volunteers ----------
export function VolunteerEditButton({ record, triggerLabel }: { record: VolunteerRecord } & Btn) {
  const allowed = useCanEdit("volunteers");
  if (!allowed) return null;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת מתנדב — ${record.name}`}
      description={`עדכון פרטי המתנדב ${record.id}.`}
      fields={volunteerFields}
      initialValues={{
        name: record.name,
        phone: record.phone ?? "",
        email: record.email ?? "",
        availability: record.availability,
        project: record.project,
        hours: String(record.hours),
        status: record.status,
        skills: record.skills.join(", "),
        notes: record.notes ?? "",
      }}
      onSave={(v) =>
        updateRecord(
          "volunteers",
          record.id,
          {
            name: v.name,
            phone: v.phone || undefined,
            email: v.email || undefined,
            availability: v.availability,
            project: v.project,
            hours: Number(v.hours) || 0,
            status: v.status as Volunteer["status"],
            skills: splitList(v.skills),
            notes: v.notes || undefined,
          },
          volunteerLabels,
          "מתנדב",
        )
      }
    />
  );
}

// ---------- Donors ----------
export function DonorEditButton({ record, triggerLabel }: { record: DonorRecord } & Btn) {
  const allowed = useCanEdit("donors");
  if (!allowed) return null;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת תורם — ${record.name}`}
      description="עדכון פרטי התורם. היסטוריית התרומות, הפגישות והאינטראקציות נשמרת במלואה."
      fields={donorFields}
      initialValues={{
        name: record.name,
        contact: record.contact ?? "",
        phone: record.phone ?? "",
        email: record.email ?? "",
        type: record.type,
        address: record.address ?? "",
        preferredChannel: record.preferredChannel ?? "",
        status: record.status,
        interests: record.interests.join(", "),
        notes: record.notes ?? "",
      }}
      onSave={(v) =>
        updateRecord(
          "donors",
          record.id,
          {
            name: v.name,
            contact: v.contact || undefined,
            phone: v.phone || undefined,
            email: v.email || undefined,
            type: v.type as Donor["type"],
            address: v.address || undefined,
            preferredChannel: v.preferredChannel || undefined,
            status: v.status as Donor["status"],
            interests: splitList(v.interests),
            notes: v.notes || undefined,
          },
          donorLabels,
          "תורם",
        )
      }
    />
  );
}

// ---------- Donor interactions ----------
export function InteractionEditButton({ record, triggerLabel }: { record: DonorInteraction } & Btn) {
  const allowed = useCanEdit("donors");
  if (!allowed) return null;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel ?? "עריכה"}
      title="עריכת אינטראקציה"
      description={`עדכון תיעוד האינטראקציה ${record.id}.`}
      fields={interactionFields}
      initialValues={{
        type: record.type,
        date: record.date,
        time: record.time,
        staff: record.staff,
        subject: record.subject,
        summary: record.summary,
        outcome: record.outcome,
        followUpAction: record.followUpAction ?? "",
        followUpDate: record.followUpDate ?? "",
        status: record.status,
      }}
      onSave={(v) => {
        const patch = {
          type: v.type as InteractionType,
          date: v.date,
          time: v.time,
          staff: v.staff,
          subject: v.subject,
          summary: v.summary,
          outcome: v.outcome,
          followUpAction: v.followUpAction || undefined,
          followUpDate: v.followUpDate || undefined,
          status: v.status as InteractionStatus,
        };
        const changes = diffValues(
          record as unknown as Record<string, unknown>,
          patch as unknown as Record<string, unknown>,
          interactionLabels,
        );
        updateInteraction(record.id, patch);
        logAudit("אינטראקציה", record.id, changes);
        logAudit("אינטראקציה", record.donorId, changes);
        return { ok: true };
      }}
    />
  );
}

// ---------- Donations ----------
export function DonationEditButton({ record, triggerLabel }: { record: DonationRecord } & Btn) {
  const allowed = useCanEdit("donations");
  const allocations = useStore(selectAllocations(record.id));
  if (!allowed) return null;
  const allocated = allocations.reduce((s, a) => s + a.amount, 0);
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת תרומה — ${record.id}`}
      description={
        allocated > 0
          ? `סכום שיועד לפרויקטים: ₪${allocated.toLocaleString()} — לא ניתן להקטין את התרומה מתחת לסכום זה.`
          : "עדכון פרטי התרומה. המזהה והשיוך לתורם נשמרים."
      }
      fields={donationFields}
      sensitiveFields={["amount"]}
      initialValues={{
        donor: record.donor,
        amount: String(record.amount),
        project: record.project,
        method: record.method,
        date: record.date,
        receipt: record.receipt,
        reference: record.reference ?? "",
        notes: record.notes ?? "",
      }}
      customValidate={(v) => {
        const amount = Number(v.amount);
        if (!amount || amount <= 0) return "יש להזין סכום חיובי.";
        if (allocated > 0 && amount < allocated)
          return `לא ניתן להקטין את סכום התרומה מתחת ל-₪${allocated.toLocaleString()} שכבר יועדו לפרויקטים.`;
        return null;
      }}
      onSave={(v) =>
        updateRecord(
          "donations",
          record.id,
          {
            donor: v.donor,
            amount: Number(v.amount),
            project: v.project,
            method: v.method as Donation["method"],
            date: v.date,
            receipt: v.receipt as Donation["receipt"],
            reference: v.reference || undefined,
            notes: v.notes || undefined,
          },
          donationLabels,
          "תרומה",
        )
      }
    />
  );
}

// ---------- Projects ----------
export function ProjectEditButton({ record, triggerLabel }: { record: ProjectRecord } & Btn) {
  const allowed = useCanEdit("projects");
  if (!allowed) return null;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת פרויקט — ${record.name}`}
      description={`עדכון פרטי הפרויקט ${record.id}. משימות, תרומות והוצאות משויכות נשמרות.`}
      fields={projectFields}
      sensitiveFields={["budget"]}
      initialValues={{
        name: record.name,
        description: record.description ?? "",
        status: record.status,
        manager: record.manager,
        startDate: record.startDate ?? "",
        endDate: record.endDate ?? "",
        budget: String(record.budget),
        requiredVolunteers: String(record.requiredVolunteers ?? record.volunteers),
        suppliers: record.suppliers ?? "",
        notes: record.notes ?? "",
      }}
      customValidate={(v) => {
        const budget = Number(v.budget);
        if (!budget || budget <= 0) return "יש להזין תקציב חיובי.";
        if (budget < record.spent)
          return `התקציב אינו יכול להיות נמוך מהביצוע בפועל (₪${record.spent.toLocaleString()}).`;
        if (v.startDate && v.endDate && v.startDate > v.endDate)
          return "תאריך הסיום חייב להיות אחרי תאריך ההתחלה.";
        return null;
      }}
      onSave={(v) =>
        updateRecord(
          "projects",
          record.id,
          {
            name: v.name,
            description: v.description || undefined,
            status: v.status as Project["status"],
            manager: v.manager,
            startDate: v.startDate || undefined,
            endDate: v.endDate || undefined,
            budget: Number(v.budget),
            requiredVolunteers: Number(v.requiredVolunteers) || undefined,
            suppliers: v.suppliers || undefined,
            notes: v.notes || undefined,
          },
          projectLabels,
          "פרויקט",
        )
      }
    />
  );
}

// ---------- Suppliers ----------
export function SupplierEditButton({ record, triggerLabel }: { record: SupplierRecord } & Btn) {
  const allowed = useCanEdit("suppliers");
  if (!allowed) return null;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת ספק — ${record.name}`}
      description={`עדכון פרטי הספק ${record.id}. חוזים, הזמנות רכש, חשבוניות ותשלומים נשמרים.`}
      fields={supplierFields}
      sensitiveFields={["status", "paymentTerms"]}
      initialValues={{
        name: record.name,
        contact: record.contact,
        phone: record.phone ?? "",
        email: record.email ?? "",
        category: record.category,
        address: record.address ?? "",
        taxId: record.taxId ?? "",
        paymentTerms: record.paymentTerms ?? "",
        status: record.status,
        notes: record.notes ?? "",
      }}
      onSave={(v) =>
        updateRecord(
          "suppliers",
          record.id,
          {
            name: v.name,
            contact: v.contact,
            phone: v.phone || undefined,
            email: v.email || undefined,
            category: v.category,
            address: v.address || undefined,
            taxId: v.taxId || undefined,
            paymentTerms: v.paymentTerms || undefined,
            status: v.status as Supplier["status"],
            notes: v.notes || undefined,
          },
          supplierLabels,
          "ספק",
        )
      }
    />
  );
}

// ---------- Families ----------
export function FamilyEditButton({ record, triggerLabel }: { record: BeneficiaryFamily } & Btn) {
  const allowed = useCanEdit("families");
  if (!allowed) return null;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת תיק משפחה — ${record.familyName}`}
      description={`עדכון פרטי התיק ${record.id}. בני המשפחה, רישומי הסיוע והמסמכים נשמרים.`}
      fields={familyFields}
      sensitiveFields={["status"]}
      initialValues={{
        familyName: record.familyName,
        mainContact: record.mainContact,
        phone: record.phone,
        email: record.email ?? "",
        city: record.city,
        countryOfOrigin: record.countryOfOrigin,
        immigrationDate: record.immigrationDate,
        membersCount: String(record.membersCount),
        assignedStaff: record.assignedStaff,
        status: record.status,
        needs: record.needs.join(", "),
        notes: record.notes ?? "",
      }}
      customValidate={(v) => {
        const count = Number(v.membersCount);
        if (!count || count < 1) return "מספר הנפשות חייב להיות לפחות 1.";
        return null;
      }}
      onSave={(v) => {
        const patch = {
          familyName: v.familyName,
          mainContact: v.mainContact,
          phone: v.phone,
          email: v.email || undefined,
          city: v.city,
          countryOfOrigin: v.countryOfOrigin,
          immigrationDate: v.immigrationDate,
          membersCount: Number(v.membersCount),
          assignedStaff: v.assignedStaff,
          status: v.status as FamilyStatus,
          needs: splitList(v.needs) as AssistanceNeed[],
          notes: v.notes || undefined,
        };
        const changes = diffValues(
          record as unknown as Record<string, unknown>,
          patch as unknown as Record<string, unknown>,
          familyLabels,
        );
        updateFamily(record.id, patch);
        logAudit("משפחה", record.id, changes);
        return { ok: true };
      }}
    />
  );
}

// ---------- Income ----------
export function IncomeEditButton({ record, triggerLabel }: { record: IncomeRecord } & Btn) {
  const allowed = useCanEdit("finance");
  if (!allowed) return null;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת הכנסה — ${record.id}`}
      description="עדכון רישום הכנסה במערכת ה-ERP."
      fields={incomeFields}
      sensitiveFields={["amount"]}
      initialValues={{
        category: record.category,
        amount: String(record.amount),
        date: record.date,
        source: record.source,
        donationId: record.donationId ?? "",
        project: record.project ?? "",
        method: record.method ?? "",
        reference: record.reference ?? "",
        notes: record.notes ?? "",
      }}
      customValidate={(v) => (Number(v.amount) > 0 ? null : "יש להזין סכום חיובי.")}
      onSave={(v) =>
        updateRecord(
          "incomes",
          record.id,
          {
            category: v.category,
            amount: Number(v.amount),
            date: v.date,
            source: v.source,
            donationId: v.donationId || undefined,
            project: v.project || undefined,
            method: v.method || undefined,
            reference: v.reference || undefined,
            notes: v.notes || undefined,
          },
          incomeLabels,
          "הכנסה",
        )
      }
    />
  );
}

// ---------- Expenses ----------
export function ExpenseEditButton({ record, triggerLabel }: { record: ExpenseRecord } & Btn) {
  const allowed = useCanEdit("finance");
  if (!allowed) return null;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת הוצאה — ${record.id}`}
      description="עדכון רישום הוצאה, סטטוס תשלום וחשבונית."
      fields={expenseFields}
      sensitiveFields={["amount", "status"]}
      initialValues={{
        category: record.category,
        amount: String(record.amount),
        date: record.date,
        supplier: record.supplier ?? "",
        project: record.project,
        status: record.status,
        receiptStatus: record.receiptStatus ?? "",
        reference: record.reference ?? "",
        notes: record.notes ?? "",
      }}
      customValidate={(v) => {
        if (!(Number(v.amount) > 0)) return "יש להזין סכום חיובי.";
        if (v.status === "שולם" && v.receiptStatus === "חסרה חשבונית")
          return "לא ניתן לסמן הוצאה כשולמה ללא חשבונית.";
        return null;
      }}
      onSave={(v) =>
        updateRecord(
          "expenses",
          record.id,
          {
            category: v.category,
            amount: Number(v.amount),
            date: v.date,
            supplier: v.supplier || undefined,
            project: v.project,
            status: v.status,
            receiptStatus: v.receiptStatus || undefined,
            reference: v.reference || undefined,
            notes: v.notes || undefined,
          },
          expenseLabels,
          "הוצאה",
        )
      }
    />
  );
}

// ---------- Users & permissions ----------
export function UserEditButton({ record, triggerLabel }: { record: UserRecord } & Btn) {
  const allowed = useCanEdit("users");
  const allUsers = useCollection("users");
  if (!allowed) return null;
  const activeAdmins = allUsers.filter((u) => u.role === "מנהל מערכת" && u.status === "פעיל");
  const isOnlyActiveAdmin =
    record.role === "מנהל מערכת" && record.status === "פעיל" && activeAdmins.length === 1;
  return (
    <RecordEditDialog
      triggerLabel={triggerLabel}
      title={`עריכת משתמש — ${record.name}`}
      description="עדכון פרטי המשתמש, תפקיד והרשאות."
      fields={userFields}
      sensitiveFields={["role", "status"]}
      initialValues={{
        name: record.name,
        email: record.email,
        role: record.role,
        status: record.status,
        permissions: record.permissions ?? "",
      }}
      customValidate={(v) => {
        if (isOnlyActiveAdmin && (v.role !== "מנהל מערכת" || v.status !== "פעיל"))
          return "לא ניתן להסיר את הרשאת מנהל המערכת האחרונה הפעילה במערכת.";
        return null;
      }}
      onSave={(v) =>
        updateRecord(
          "users",
          record.id,
          {
            name: v.name,
            email: v.email,
            role: v.role as User["role"],
            status: v.status as User["status"],
            permissions: v.permissions || undefined,
          },
          userLabels,
          "משתמש",
        )
      }
    />
  );
}
