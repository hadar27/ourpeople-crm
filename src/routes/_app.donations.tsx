import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { donations, type Donation } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/donations")({
  component: DonationsPage,
});

const columns: Column<Donation>[] = [
  { key: "id", header: "מזהה" },
  { key: "donor", header: "תורם", render: (r) => <span className="font-medium">{r.donor}</span> },
  { key: "amount", header: "סכום", render: (r) => <span className="font-semibold tabular-nums">₪{r.amount.toLocaleString()}</span> },
  { key: "project", header: "פרויקט" },
  { key: "method", header: "אופן תשלום" },
  { key: "receipt", header: "קבלה", render: (r) => <StatusBadge value={r.receipt} /> },
  { key: "date", header: "תאריך" },
];

function DonationsPage() {
  return (
    <>
      <PageHeader
        title="ניהול תרומות"
        description="כל הכניסות הכספיות מתורמים, קמפיינים ואירועים."
        actions={
          <Button className="bg-brand hover:bg-brand-deep gap-1" onClick={() => toast.success("תרומה חדשה נקלטה בהצלחה")}>
            <Plus className="h-4 w-4" /> קליטת תרומה
          </Button>
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
      <DataTable rows={donations} columns={columns} searchKeys={["donor", "project", "id"]} getRowHref={(r) => `/donation/${r.id}`} />
    </>
  );
}
