import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { useDonations, useCreateDonation, ANONYMOUS_DONOR, type DonationRecord } from "@/lib/queries/donations";
import { useDonors } from "@/lib/queries/donors";
import { useProjects } from "@/lib/queries/projects";
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
  const { data: donations, isLoading, isError, refetch } = useDonations();
  const { data: donors } = useDonors();
  const { data: projects } = useProjects();
  const createDonation = useCreateDonation();

  const donorOptions = [...(donors ?? []).map((d) => d.name), ANONYMOUS_DONOR];
  const projectOptions = (projects ?? []).map((p) => p.name);

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
              { name: "donor", label: "שם תורם", type: "select", required: true, options: donorOptions },
              { name: "amount", label: "סכום (₪)", type: "number", required: true },
              { name: "project", label: "פרויקט / פעילות מיועדת", type: "select", options: projectOptions },
              { name: "method", label: "אופן תשלום", type: "select", required: true, options: ["העברה בנקאית", "אשראי", "מזומן", "שיק"] },
              { name: "date", label: "תאריך", type: "date", required: true },
              { name: "receipt", label: "סטטוס קבלה", type: "select", options: ["הופק", "ממתין", "חסר"] },
              { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
            ]}
            onCreate={async (v) => {
              const isAnonymous = v.donor === ANONYMOUS_DONOR;
              const donor = (donors ?? []).find((d) => d.name === v.donor);
              const project = (projects ?? []).find((p) => p.name === v.project);
              try {
                await createDonation.mutateAsync({
                  donorId: donor?.id,
                  isAnonymous,
                  amount: Number(v.amount) || 0,
                  projectId: project?.id,
                  project: v.project || "",
                  method: v.method as DonationRecord["method"],
                  receipt: (v.receipt || "ממתין") as DonationRecord["receipt"],
                  date: v.date,
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
        <div className="card-elevated p-4 bg-brand-gradient text-white">
          <div className="text-xs opacity-80">סך תרומות החודש</div>
          <div className="text-2xl font-bold mt-1">₪290,800</div>
        </div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">תרומות החודש</div><div className="text-xl font-bold mt-1">47</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">קבלות הופקו</div><div className="text-xl font-bold mt-1">41</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">קבלות חסרות</div><div className="text-xl font-bold mt-1 text-rose-600">6</div></div>
      </div>
      {isLoading ? (
        <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> טוען תרומות...
        </div>
      ) : isError ? (
        <div className="card-elevated flex flex-col items-center gap-3 p-16 text-center">
          <div className="text-sm text-muted-foreground">אירעה שגיאה בטעינת התרומות.</div>
          <button onClick={() => refetch()} className="text-sm text-brand hover:underline">נסה שוב</button>
        </div>
      ) : (
        <DataTable rows={donations ?? []} columns={columns} searchKeys={["donor", "project", "id"]} getRowHref={(r) => `/donation/${r.id}`} rowActions={(r) => <DonationEditButton record={r} />} />
      )}
    </>
  );
}
