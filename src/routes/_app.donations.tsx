import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { useCollection, type DonationRecord } from "@/lib/records-store";
import { DonationEditButton } from "@/components/module-edit-dialogs";

export const Route = createFileRoute("/_app/donations")({
  component: DonationsPage,
});

const columns: Column<DonationRecord>[] = [
  { key: "id", header: "מזהה" },
  { key: "donor", header: "תורם", render: (r) => <span className="font-medium">{r.donor}</span> },
  { key: "amount", header: "סכום", render: (r) => <span className="font-semibold tabular-nums">₪{r.amount.toLocaleString()}</span> },
  { key: "project", header: "פרויקט" },
  { key: "method", header: "אופן תשלום" },
  { key: "receipt", header: "קבלה", render: (r) => <StatusBadge value={r.receipt} /> },
  { key: "date", header: "תאריך" },
];

function DonationsPage() {
  const donations = useCollection("donations");
  return (
    <>
      <PageHeader
        title="ניהול תרומות"
        description="כל הכניסות הכספיות מתורמים, קמפיינים ואירועים."
        actions={
          <EntityFormDialog
            triggerLabel="קליטת תרומה"
            title="קליטת תרומה חדשה"
            description="רישום תרומה למעקב כספי ולהנפקת קבלה."
            successMessage="תרומה חדשה נקלטה בהצלחה"
            fields={[
              { name: "donor", label: "שם תורם", required: true },
              { name: "amount", label: "סכום (₪)", type: "number", required: true },
              { name: "project", label: "פרויקט מיועד", type: "select", options: ["קייטנת קיץ", "סיוע למשפחות", "מועדון נוער", "תוכנית נשים", "כללי"] },
              { name: "method", label: "אופן תשלום", type: "select", required: true, options: ["העברה בנקאית", "אשראי", "מזומן", "צ׳ק", "הוראת קבע"] },
              { name: "date", label: "תאריך", type: "date", required: true },
              { name: "receipt", label: "סטטוס קבלה", type: "select", options: ["הונפקה", "ממתינה", "לא נדרשת"] },
              { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
            ]}
          />
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated p-4 bg-brand-gradient text-white">
          <div className="text-xs opacity-80">סך תרומות החודש</div>
          <div className="text-2xl font-bold mt-1">₪290,800</div>
        </div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">תרומות החודש</div><div className="text-xl font-bold mt-1">47</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">קבלות הופקו</div><div className="text-xl font-bold mt-1">41</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">קבלות חסרות</div><div className="text-xl font-bold mt-1 text-rose-600">6</div></div>
      </div>
      <DataTable rows={donations} columns={columns} searchKeys={["donor", "project", "id"]} getRowHref={(r) => `/donation/${r.id}`} rowActions={(r) => <DonationEditButton record={r} />} />
    </>
  );
}
