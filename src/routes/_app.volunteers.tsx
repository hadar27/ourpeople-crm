import { createFileRoute } from "@tanstack/react-router";
import { Plus, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { volunteers, type Volunteer } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/volunteers")({
  component: VolunteersPage,
});

const columns: Column<Volunteer>[] = [
  { key: "name", header: "שם", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "availability", header: "זמינות" },
  { key: "project", header: "פרויקט משויך" },
  { key: "hours", header: "שעות התנדבות", render: (r) => <span className="tabular-nums">{r.hours}</span> },
  { key: "skills", header: "כישורים", render: (r) => (
      <div className="flex flex-wrap gap-1">
        {r.skills.map((s) => (
          <span key={s} className="text-xs bg-secondary text-brand-deep px-2 py-0.5 rounded-full">{s}</span>
        ))}
      </div>
    ),
  },
  { key: "status", header: "סטטוס", render: (r) => <StatusBadge value={r.status} /> },
];

function VolunteersPage() {
  return (
    <>
      <PageHeader
        title="ניהול מתנדבים"
        description="מאגר מתנדבים, שיוך לפרויקטים, מעקב שעות וכישורים."
        actions={
          <Button className="bg-brand hover:bg-brand-deep gap-1" onClick={() => toast.success("מתנדב חדש נוסף בהצלחה")}>
            <Plus className="h-4 w-4" /> הוסף מתנדב
          </Button>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">מתנדבים פעילים</div><div className="text-xl font-bold mt-1">186</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">שעות החודש</div><div className="text-xl font-bold mt-1">3,240</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">פרויקטים פעילים</div><div className="text-xl font-bold mt-1">14</div></div>
        <div className="card-elevated p-4 bg-soft-gradient flex items-center gap-3">
          <Award className="h-8 w-8 text-brand-deep" />
          <div>
            <div className="text-xs text-muted-foreground">מתנדב/ת החודש</div>
            <div className="text-sm font-bold">פאדי נסר</div>
          </div>
        </div>
      </div>
      <DataTable rows={volunteers} columns={columns} searchKeys={["name", "project", "availability"]} getRowHref={(r) => `/volunteer/${r.id}`} />
    </>
  );
}
