import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { donors, type Donor } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/donors")({
  component: DonorsPage,
});

const columns: Column<Donor>[] = [
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
  return (
    <>
      <PageHeader
        title="ניהול תורמים"
        description="פרופיל תורם, היסטוריית תרומות, פגישות ואינטראקציות."
        actions={
          <Button className="bg-brand hover:bg-brand-deep gap-1" onClick={() => toast.success("תורם חדש נוסף בהצלחה")}>
            <Plus className="h-4 w-4" /> הוסף תורם
          </Button>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">סה״כ תורמים</div><div className="text-xl font-bold mt-1">412</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">תורמים חוזרים</div><div className="text-xl font-bold mt-1">198</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">תרומה ממוצעת</div><div className="text-xl font-bold mt-1">₪3,240</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">פגישות החודש</div><div className="text-xl font-bold mt-1">22</div></div>
      </div>
      <DataTable rows={donors} columns={columns} searchKeys={["name", "type"]} getRowHref={(r) => `/donor/${r.id}`} />
    </>
  );
}
