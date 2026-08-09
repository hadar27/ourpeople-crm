import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import type { SupplierRecord } from "@/lib/records-store";
import { useSuppliers, useCreateSupplier } from "@/lib/queries/suppliers";
import { SupplierEditButton } from "@/components/module-edit-dialogs";

export const Route = createFileRoute("/_app/suppliers")({
  component: SuppliersPage,
});

const columns: Column<SupplierRecord>[] = [
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
  const { data: suppliers, isLoading, isError, refetch } = useSuppliers();
  const createSupplier = useCreateSupplier();

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
            onCreate={async (v) => {
              try {
                await createSupplier.mutateAsync({
                  name: v.name,
                  category: v.category,
                  contact: v.contact,
                  phone: v.phone || undefined,
                  email: v.email || undefined,
                  taxId: v.taxId || undefined,
                  notes: v.notes || undefined,
                });
                return { ok: true };
              } catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : "השמירה נכשלה" };
              }
            }}
          />
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">ספקים פעילים</div><div className="text-xl font-bold mt-1">24</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">חוזים בתוקף</div><div className="text-xl font-bold mt-1">38</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">חשבוניות פתוחות</div><div className="text-xl font-bold mt-1 text-amber-600">7</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">יתרת תשלום</div><div className="text-xl font-bold mt-1">₪82,300</div></div>
      </div>
      {isLoading ? (
        <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> טוען ספקים...
        </div>
      ) : isError ? (
        <div className="card-elevated flex flex-col items-center gap-3 p-16 text-center">
          <div className="text-sm text-muted-foreground">אירעה שגיאה בטעינת הספקים.</div>
          <button onClick={() => refetch()} className="text-sm text-brand hover:underline">
            נסה שוב
          </button>
        </div>
      ) : (
        <DataTable
          rows={suppliers ?? []}
          columns={columns}
          searchKeys={["name", "category", "contact"]}
          getRowHref={(r) => `/suppliers/${r.id}`}
          rowActions={(r) => <SupplierEditButton record={r} />}
        />
      )}
    </>
  );
}
