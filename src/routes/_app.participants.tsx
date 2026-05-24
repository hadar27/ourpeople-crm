import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { participants, type Participant } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/participants")({
  component: ParticipantsPage,
});

const columns: Column<Participant>[] = [
  { key: "name", header: "שם מלא", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "idNumber", header: "ת.ז." },
  { key: "phone", header: "טלפון" },
  { key: "activity", header: "פעילות" },
  { key: "status", header: "סטטוס רישום", render: (r) => <StatusBadge value={r.status} /> },
  { key: "paymentStatus", header: "תשלום", render: (r) => <StatusBadge value={r.paymentStatus} /> },
];

function ParticipantsPage() {
  return (
    <>
      <PageHeader
        title="ניהול נרשמים"
        description="רשימת כל המשתתפים הרשומים לפעילויות, סדנאות וקייטנות."
        actions={
          <EntityFormDialog
            triggerLabel="הוסף נרשם"
            title="הוספת נרשם חדש"
            description="הזן את פרטי המשתתף החדש לרישום במערכת."
            successMessage="נרשם חדש נוסף בהצלחה"
            fields={[
              { name: "fullName", label: "שם מלא", required: true, placeholder: "ישראל ישראלי" },
              { name: "idNumber", label: "תעודת זהות", required: true, placeholder: "123456789" },
              { name: "phone", label: "טלפון", type: "tel", required: true, placeholder: "050-0000000" },
              { name: "email", label: "אימייל", type: "email", placeholder: "name@example.com" },
              { name: "activity", label: "פעילות", type: "select", required: true, options: ["קייטנת קיץ", "סדנה חינוכית", "תוכנית נשים", "מועדון נוער"] },
              { name: "payment", label: "אמצעי תשלום", type: "select", options: ["מזומן", "אשראי", "העברה בנקאית", "צ׳ק"] },
              { name: "notes", label: "הערות", type: "textarea", colSpan: 2, placeholder: "הערות נוספות..." },
            ]}
          />
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Mini label="סה״כ נרשמים" value="1,284" />
        <Mini label="פעילים החודש" value="612" />
        <Mini label="ממתינים לאישור" value="38" />
        <Mini label="חוב פתוח" value="₪14,200" />
      </div>
      <DataTable rows={participants} columns={columns} searchKeys={["name", "idNumber", "phone", "activity"]} />
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-elevated p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
