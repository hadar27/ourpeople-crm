import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { useCollection, type DonorRecord } from "@/lib/records-store";
import { DonorEditButton } from "@/components/module-edit-dialogs";

export const Route = createFileRoute("/_app/donors")({
  component: DonorsPage,
});

const columns: Column<DonorRecord>[] = [
  { key: "name", header: "שם תורם", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "type", header: "סוג", render: (r) => <StatusBadge value={r.type} /> },
  { key: "totalDonated", header: "סך תרומות", render: (r) => <span className="font-semibold tabular-nums">₪{r.totalDonated.toLocaleString()}</span> },
  { key: "lastDonation", header: "תרומה אחרונה" },
  { key: "interests", header: "תחומי עניין", render: (r) => (
      <div className="flex flex-wrap gap-1">
        {r.interests.map((i) => <span key={i} className="text-xs bg-secondary text-brand-deep px-2 py-0.5 rounded-full">{i}</span>)}
      </div>
    ),
  },
  { key: "status", header: "סטטוס", render: (r) => <StatusBadge value={r.status} /> },
];

function DonorsPage() {
  const donors = useCollection("donors");
  return (
    <>
      <PageHeader
        title="ניהול תורמים"
        description="פרופיל תורם, היסטוריית תרומות, פגישות ואינטראקציות."
        actions={
          <EntityFormDialog
            triggerLabel="הוסף תורם"
            title="הוספת תורם חדש"
            description="פרטי תורם לרישום במאגר התורמים."
            successMessage="תורם חדש נוסף בהצלחה"
            fields={[
              { name: "name", label: "שם תורם", required: true },
              { name: "phone", label: "טלפון", type: "tel", required: true },
              { name: "email", label: "אימייל", type: "email" },
              { name: "type", label: "סוג תורם", type: "select", required: true, options: ["פרטי", "עסקי", "קרן", "אנונימי"] },
              { name: "interests", label: "תחומי עניין", colSpan: 2, placeholder: "חינוך, בריאות, רווחה..." },
              { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
            ]}
          />
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">סה״כ תורמים</div><div className="text-xl font-bold mt-1">412</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">תורמים חוזרים</div><div className="text-xl font-bold mt-1">198</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">תרומה ממוצעת</div><div className="text-xl font-bold mt-1">₪3,240</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">פגישות החודש</div><div className="text-xl font-bold mt-1">22</div></div>
      </div>
      <DataTable rows={donors} columns={columns} searchKeys={["name", "type"]} getRowHref={(r) => `/donor/${r.id}`} rowActions={(r) => <DonorEditButton record={r} />} />
    </>
  );
}
