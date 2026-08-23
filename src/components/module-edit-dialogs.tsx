// Per-module edit buttons. Each one is permission-gated, pre-filled with the
// current record and writes back through the record store (id preserved).
import { RecordEditDialog } from "@/components/record-edit-dialog";
import { DeleteRecordButton } from "@/components/delete-record-dialog";
import { useCanEdit } from "@/lib/permissions";
import { useDonors, useUpdateDonor, useDeleteDonor, type DonorRecord } from "@/lib/queries/donors";
import { useProjects, useUpdateProject, type ProjectRecord } from "@/lib/queries/projects";
import {
  useUpdateParticipant,
  useDeleteParticipant,
  type ParticipantRecord,
} from "@/lib/queries/participants";
import {
  useUpdateVolunteer,
  useDeleteVolunteer,
  type VolunteerRecord,
} from "@/lib/queries/volunteers";
import { useUsers, useUpdateUser, useDeleteUser, type UserRecord } from "@/lib/queries/users";
import {
  ANONYMOUS_DONOR,
  useUpdateDonation,
  useDeleteDonation,
  type DonationRecord,
} from "@/lib/queries/donations";
import {
  useSuppliers,
  useUpdateSupplier,
  useDeleteSupplier,
  type SupplierRecord,
} from "@/lib/queries/suppliers";
import { useUpdateIncome, useDeleteIncome, type IncomeRecord } from "@/lib/queries/incomes";
import { useUpdateExpense, useDeleteExpense, type ExpenseRecord } from "@/lib/queries/expenses";
import { useUpdateFamily, useDeleteFamily, type FamilyRecord } from "@/lib/queries/families";
import { useUpdateInteraction } from "@/lib/queries/interactions";
import {
  donationFields,
  donorFields,
  expenseFields,
  familyFields,
  incomeFields,
  interactionFields,
  participantFields,
  projectFields,
  splitList,
  supplierFields,
  userFields,
  volunteerFields,
} from "@/lib/edit-forms";
import { useAllocationsForDonation } from "@/lib/queries/allocations";
import type {
  AssistanceNeed,
  DonorInteraction,
  FamilyStatus,
  InteractionStatus,
  InteractionType,
} from "@/lib/crm-types";

type Btn = { triggerLabel?: string };

// ---------- Participants ----------
export function ParticipantEditButton({
  record,
  triggerLabel,
}: { record: ParticipantRecord } & Btn) {
  const allowed = useCanEdit("participants");
  const updateParticipant = useUpdateParticipant();
  const { data: projects } = useProjects();
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
        project: record.project,
        source: record.source,
        status: record.status,
        paymentStatus: record.paymentStatus,
        documentsComplete: record.documentsComplete ? "הושלמו" : "חסרים",
        notes: record.notes ?? "",
      }}
      customValidate={(v) => {
        if (record.projectType === "בתשלום" && v.status === "מאושר" && v.paymentStatus !== "שולם") {
          return "פעילות בתשלום יכולה להיות מאושרת רק לאחר תשלום מלא.";
        }
        return null;
      }}
      onSave={async (v) => {
        const def = (projects ?? []).find((p) => p.name === v.project);
        if (!def) return { ok: false, error: "פרויקט לא תקין" };
        try {
          await updateParticipant.mutateAsync({
            id: record.id,
            patch: {
              name: v.name,
              idNumber: v.idNumber,
              phone: v.phone,
              email: v.email || undefined,
              address: v.address || undefined,
              city: v.city || undefined,
              projectId: def.id,
              source: v.source as ParticipantRecord["source"],
              status: v.status as ParticipantRecord["status"],
              paymentStatus: v.paymentStatus as ParticipantRecord["paymentStatus"],
              documentsComplete: v.documentsComplete === "הושלמו",
              notes: v.notes || undefined,
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

export function ParticipantDeleteButton({ record }: { record: ParticipantRecord }) {
  const allowed = useCanEdit("participants");
  const deleteParticipant = useDeleteParticipant();
  if (!allowed) return null;
  return (
    <DeleteRecordButton
      title={`מחיקת נרשם — ${record.name}`}
      description="פעולה זו תמחק לצמיתות את הנרשם. לא ניתן לשחזר אחרי המחיקה."
      onDelete={() => deleteParticipant.mutateAsync(record.id)}
    />
  );
}

// ---------- Volunteers ----------
export function VolunteerEditButton({ record, triggerLabel }: { record: VolunteerRecord } & Btn) {
  const allowed = useCanEdit("volunteers");
  const updateVolunteer = useUpdateVolunteer();
  const { data: projects } = useProjects();
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
      onSave={async (v) => {
        const def = (projects ?? []).find((p) => p.name === v.project);
        try {
          await updateVolunteer.mutateAsync({
            id: record.id,
            patch: {
              name: v.name,
              phone: v.phone || undefined,
              email: v.email || undefined,
              availability: v.availability,
              projectId: def?.id,
              hours: Number(v.hours) || 0,
              status: v.status as VolunteerRecord["status"],
              skills: splitList(v.skills),
              notes: v.notes || undefined,
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

export function VolunteerDeleteButton({ record }: { record: VolunteerRecord }) {
  const allowed = useCanEdit("volunteers");
  const deleteVolunteer = useDeleteVolunteer();
  if (!allowed) return null;
  return (
    <DeleteRecordButton
      title={`מחיקת מתנדב — ${record.name}`}
      description="פעולה זו תמחק לצמיתות את המתנדב. לא ניתן לשחזר אחרי המחיקה."
      onDelete={() => deleteVolunteer.mutateAsync(record.id)}
    />
  );
}

// ---------- Donors ----------
export function DonorEditButton({ record, triggerLabel }: { record: DonorRecord } & Btn) {
  const allowed = useCanEdit("donors");
  const updateDonor = useUpdateDonor();
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
      onSave={async (v) => {
        try {
          await updateDonor.mutateAsync({
            id: record.id,
            patch: {
              name: v.name,
              contact: v.contact || undefined,
              phone: v.phone || undefined,
              email: v.email || undefined,
              type: v.type as DonorRecord["type"],
              address: v.address || undefined,
              preferredChannel: v.preferredChannel || undefined,
              status: v.status as DonorRecord["status"],
              interests: splitList(v.interests),
              notes: v.notes || undefined,
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

export function DonorDeleteButton({ record }: { record: DonorRecord }) {
  const allowed = useCanEdit("donors");
  const deleteDonor = useDeleteDonor();
  if (!allowed) return null;
  return (
    <DeleteRecordButton
      title={`מחיקת תורם — ${record.name}`}
      description="פעולה זו תמחק לצמיתות את התורם. תרומות, פגישות ואינטראקציות משויכות ימנעו את המחיקה."
      onDelete={() => deleteDonor.mutateAsync(record.id)}
    />
  );
}

// ---------- Donor interactions ----------
export function InteractionEditButton({
  record,
  triggerLabel,
}: { record: DonorInteraction } & Btn) {
  const allowed = useCanEdit("donors");
  const updateInteraction = useUpdateInteraction();
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
      onSave={async (v) => {
        try {
          await updateInteraction.mutateAsync({
            id: record.id,
            patch: {
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
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

// ---------- Donations ----------
export function DonationEditButton({ record, triggerLabel }: { record: DonationRecord } & Btn) {
  const allowed = useCanEdit("donations");
  const { data: allocationsData } = useAllocationsForDonation(record.id);
  const allocations = allocationsData ?? [];
  const updateDonation = useUpdateDonation();
  const { data: donors } = useDonors();
  const { data: projects } = useProjects();
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
      onSave={async (v) => {
        const isAnonymous = v.donor === ANONYMOUS_DONOR;
        const donor = (donors ?? []).find((d) => d.name === v.donor);
        const project = (projects ?? []).find((p) => p.name === v.project);
        try {
          await updateDonation.mutateAsync({
            id: record.id,
            patch: {
              donorId: donor?.id,
              isAnonymous,
              amount: Number(v.amount),
              projectId: project?.id,
              project: v.project,
              method: v.method as DonationRecord["method"],
              date: v.date,
              receipt: v.receipt as DonationRecord["receipt"],
              reference: v.reference || undefined,
              notes: v.notes || undefined,
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

export function DonationDeleteButton({ record }: { record: DonationRecord }) {
  const allowed = useCanEdit("donations");
  const deleteDonation = useDeleteDonation();
  if (!allowed) return null;
  return (
    <DeleteRecordButton
      title={`מחיקת תרומה — ${record.id}`}
      description="פעולה זו תמחק לצמיתות את התרומה. הכנסות והקצאות משויכות ימנעו את המחיקה."
      onDelete={() => deleteDonation.mutateAsync(record.id)}
    />
  );
}

// ---------- Projects ----------
export function ProjectEditButton({ record, triggerLabel }: { record: ProjectRecord } & Btn) {
  const allowed = useCanEdit("projects");
  const updateProject = useUpdateProject();
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
      onSave={async (v) => {
        try {
          await updateProject.mutateAsync({
            id: record.id,
            patch: {
              name: v.name,
              description: v.description || undefined,
              status: v.status as ProjectRecord["status"],
              manager: v.manager,
              startDate: v.startDate || undefined,
              endDate: v.endDate || undefined,
              budget: Number(v.budget),
              requiredVolunteers: Number(v.requiredVolunteers) || undefined,
              suppliers: v.suppliers || undefined,
              notes: v.notes || undefined,
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

// ---------- Suppliers ----------
export function SupplierEditButton({ record, triggerLabel }: { record: SupplierRecord } & Btn) {
  const allowed = useCanEdit("suppliers");
  const updateSupplier = useUpdateSupplier();
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
      onSave={async (v) => {
        const patch = {
          name: v.name,
          contact: v.contact,
          phone: v.phone || undefined,
          email: v.email || undefined,
          category: v.category,
          address: v.address || undefined,
          taxId: v.taxId || undefined,
          paymentTerms: v.paymentTerms || undefined,
          status: v.status as SupplierRecord["status"],
          notes: v.notes || undefined,
        };
        try {
          await updateSupplier.mutateAsync({ id: record.id, patch });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

export function SupplierDeleteButton({ record }: { record: SupplierRecord }) {
  const allowed = useCanEdit("suppliers");
  const deleteSupplier = useDeleteSupplier();
  if (!allowed) return null;
  return (
    <DeleteRecordButton
      title={`מחיקת ספק — ${record.name}`}
      description="פעולה זו תמחק לצמיתות את הספק. חוזים, הזמנות רכש, חשבוניות ותשלומים משויכים ימנעו את המחיקה."
      onDelete={() => deleteSupplier.mutateAsync(record.id)}
    />
  );
}

// ---------- Families ----------
export function FamilyEditButton({ record, triggerLabel }: { record: FamilyRecord } & Btn) {
  const allowed = useCanEdit("families");
  const updateFamily = useUpdateFamily();
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
      onSave={async (v) => {
        try {
          await updateFamily.mutateAsync({
            id: record.id,
            patch: {
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
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

export function FamilyDeleteButton({ record }: { record: FamilyRecord }) {
  const allowed = useCanEdit("families");
  const deleteFamily = useDeleteFamily();
  if (!allowed) return null;
  return (
    <DeleteRecordButton
      title={`מחיקת תיק משפחה — ${record.familyName}`}
      description="פעולה זו תמחק לצמיתות את התיק. בני המשפחה ורישומי הסיוע המשויכים ימנעו את המחיקה."
      onDelete={() => deleteFamily.mutateAsync(record.id)}
    />
  );
}

// ---------- Income ----------
export function IncomeEditButton({ record, triggerLabel }: { record: IncomeRecord } & Btn) {
  const allowed = useCanEdit("finance");
  const updateIncome = useUpdateIncome();
  const { data: projects } = useProjects();
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
      onSave={async (v) => {
        const project = (projects ?? []).find((p) => p.name === v.project);
        try {
          await updateIncome.mutateAsync({
            id: record.id,
            patch: {
              category: v.category,
              amount: Number(v.amount),
              date: v.date,
              source: v.source,
              donationId: v.donationId || undefined,
              projectId: project?.id,
              project: v.project || undefined,
              method: v.method || undefined,
              reference: v.reference || undefined,
              notes: v.notes || undefined,
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

export function IncomeDeleteButton({ record }: { record: IncomeRecord }) {
  const allowed = useCanEdit("finance");
  const deleteIncome = useDeleteIncome();
  if (!allowed) return null;
  return (
    <DeleteRecordButton
      title={`מחיקת הכנסה — ${record.id}`}
      description="פעולה זו תמחק לצמיתות את רישום ההכנסה. לא ניתן לשחזר אחרי המחיקה."
      onDelete={() => deleteIncome.mutateAsync(record.id)}
    />
  );
}

// ---------- Expenses ----------
export function ExpenseEditButton({ record, triggerLabel }: { record: ExpenseRecord } & Btn) {
  const allowed = useCanEdit("finance");
  const updateExpense = useUpdateExpense();
  const { data: projects } = useProjects();
  const { data: suppliers } = useSuppliers();
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
      onSave={async (v) => {
        const project = (projects ?? []).find((p) => p.name === v.project);
        const supplier = (suppliers ?? []).find((s) => s.name === v.supplier);
        try {
          await updateExpense.mutateAsync({
            id: record.id,
            patch: {
              category: v.category,
              amount: Number(v.amount),
              date: v.date,
              supplierId: supplier?.id,
              supplier: v.supplier || "",
              projectId: project?.id,
              project: v.project,
              status: v.status,
              receiptStatus: v.receiptStatus || undefined,
              reference: v.reference || undefined,
              notes: v.notes || undefined,
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

export function ExpenseDeleteButton({ record }: { record: ExpenseRecord }) {
  const allowed = useCanEdit("finance");
  const deleteExpense = useDeleteExpense();
  if (!allowed) return null;
  return (
    <DeleteRecordButton
      title={`מחיקת הוצאה — ${record.id}`}
      description="פעולה זו תמחק לצמיתות את רישום ההוצאה. לא ניתן לשחזר אחרי המחיקה."
      onDelete={() => deleteExpense.mutateAsync(record.id)}
    />
  );
}

// ---------- Users & permissions ----------
export function UserEditButton({ record, triggerLabel }: { record: UserRecord } & Btn) {
  const allowed = useCanEdit("users");
  const { data: allUsers } = useUsers();
  const updateUser = useUpdateUser();
  if (!allowed) return null;
  const activeAdmins = (allUsers ?? []).filter(
    (u) => u.role === "מנהל מערכת" && u.status === "פעיל",
  );
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
      onSave={async (v) => {
        try {
          await updateUser.mutateAsync({
            id: record.id,
            patch: {
              name: v.name,
              email: v.email,
              role: v.role as UserRecord["role"],
              status: v.status as UserRecord["status"],
              permissions: v.permissions || undefined,
            },
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : "שמירת השינויים נכשלה" };
        }
      }}
    />
  );
}

export function UserDeleteButton({ record }: { record: UserRecord }) {
  const allowed = useCanEdit("users");
  const { data: allUsers } = useUsers();
  const deleteUser = useDeleteUser();
  if (!allowed) return null;
  const activeAdmins = (allUsers ?? []).filter(
    (u) => u.role === "מנהל מערכת" && u.status === "פעיל",
  );
  const isOnlyActiveAdmin =
    record.role === "מנהל מערכת" && record.status === "פעיל" && activeAdmins.length === 1;
  return (
    <DeleteRecordButton
      title={`מחיקת משתמש — ${record.name}`}
      description="פעולה זו תמחק לצמיתות את המשתמש ותסיר את הגישה שלו למערכת."
      onDelete={async () => {
        if (isOnlyActiveAdmin) {
          throw new Error("לא ניתן למחוק את מנהל המערכת האחרון הפעיל במערכת.");
        }
        await deleteUser.mutateAsync(record.id);
      }}
    />
  );
}
