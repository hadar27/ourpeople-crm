import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { suppliers, type Supplier } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/suppliers")({
  component: SuppliersPage,
});

const columns: Column<Supplier>[] = [
  { key: "name", header: "שם הספק", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "category", header: "קטגוריה" },
  { key: "contact", header: "איש קשר" },
  { key: "contracts", header: "חוזים פעילים", render: (r) => <span className="tabular-nums">{r.contracts}</span> },
  { key: "openInvoices", header: "חשבוניות פתוחות", render: (r) => (
      <span className={`tabular-nums font-semibold ${r.openInvoices > 0 ? "text-amber-700" : "text-emerald-700"}`}>{r.openInvoices}</span>
    ),
  },
  { key: "status", header: "סטטוס", render: (r) => <StatusBadge value={r.status} /> },
];

function SuppliersPage() {
  return (
    <>
      <PageHeader
        title="ניהול ספקים"
        description="ספקי המערכת, חוזים, חשבוניות ותשלומים."
        actions={
          <EntityFormDialog
            triggerLabel="הוסף ספק"
            title="הוספת ספק חדש"
            description="רישום ספק חדש למאגר ולמערכת החוזים."
            successMessage="ספק חדש נוסף בהצלחה"
            fields={[
              { name: "name", label: "שם הספק", required: true },
              { name: "category", label: "קטגוריה", type: "select", required: true, options: ["מזון", "ציוד", "הסעות", "תקשורת", "שיווק", "אחר"] },
              { name: "contact", label: "איש קשר", required: true },
              { name: "phone", label: "טלפון", type: "tel", required: true },
              { name: "email", label: "אימייל", type: "email" },
              { name: "taxId", label: "ח.פ. / עוסק", placeholder: "123456789" },
              { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
            ]}
          />
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">ספקים פעילים</div><div className="text-xl font-bold mt-1">24</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">חוזים בתוקף</div><div className="text-xl font-bold mt-1">38</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">חשבוניות פתוחות</div><div className="text-xl font-bold mt-1 text-amber-600">7</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">יתרת תשלום</div><div className="text-xl font-bold mt-1">₪82,300</div></div>
      </div>
      <DataTable rows={suppliers} columns={columns} searchKeys={["name", "category", "contact"]} />
    </>
  );
}
