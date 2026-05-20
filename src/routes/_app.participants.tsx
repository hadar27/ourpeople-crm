import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
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
          <Button className="bg-brand hover:bg-brand-deep gap-1">
            <Plus className="h-4 w-4" /> הוסף נרשם
          </Button>
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
