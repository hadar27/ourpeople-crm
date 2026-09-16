import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column, type FilterConfig } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { useDonors, useCreateDonor, type DonorRecord } from "@/lib/queries/donors";
import { useAllInteractions } from "@/lib/queries/interactions";
import { useDonations } from "@/lib/queries/donations";
import { DonorEditButton, DonorDeleteButton } from "@/components/module-edit-dialogs";

export const Route = createFileRoute("/_app/donors")({
  component: DonorsPage,
});

type DonorTableRecord = DonorRecord & { receiptStatus: string };

const columns: Column<DonorTableRecord>[] = [
  { key: "name", header: "שם תורם", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "idNumber", header: "ת.ז. / ח.פ.", render: (r) => r.idNumber || "—" },
  { key: "phone", header: "טלפון", render: (r) => r.phone || "—" },
  { key: "email", header: "אימייל", render: (r) => r.email || "—" },
  { key: "type", header: "סוג", render: (r) => <StatusBadge value={r.type} /> },
  {
    key: "totalDonated",
    header: "סך תרומות",
    render: (r) => (
      <span className="font-semibold tabular-nums">₪{r.totalDonated.toLocaleString()}</span>
    ),
  },
  { key: "lastDonation", header: "תרומה אחרונה" },
  {
    key: "receiptStatus",
    header: "קבלות",
    render: (r) => <StatusBadge value={r.receiptStatus} />,
  },
  { key: "status", header: "סטטוס", render: (r) => <StatusBadge value={r.status} /> },
];

const getDonorSize = (donor: DonorRecord): string => {
  if (donor.totalDonated <= 5000) return "קטן";
  if (donor.totalDonated <= 50000) return "בינוני";
  return "גדול";
};

const filters: FilterConfig<DonorRecord>[] = [
  { key: "type", label: "סוג תורם", type: "multi-select", options: ["פרטי", "תאגיד", "קרן"] },
  { key: "status", label: "סטטוס", type: "multi-select", options: ["פעיל", "לא פעיל"] },
  {
    key: "donorSize",
    label: "גודל תורם",
    type: "multi-select",
    options: ["קטן", "בינוני", "גדול"],
    getValue: getDonorSize,
  },
];

function DonorsPage() {
  const { data: donors, isLoading, isError, refetch } = useDonors();
  const { data: interactions } = useAllInteractions();
  const { data: donations } = useDonations();
  const createDonor = useCreateDonor();
  const tableRows: DonorTableRecord[] = (donors ?? []).map((donor) => {
    const donorDonations = (donations ?? []).filter((donation) => donation.donorId === donor.id);
    const notIssued = donorDonations.filter((donation) => donation.receipt !== "הופק").length;
    return {
      ...donor,
      receiptStatus:
        donorDonations.length === 0
          ? "אין תרומות"
          : notIssued > 0
            ? `לא הופקו (${notIssued})`
            : "הופקו",
    };
  });

  // Calculate real aggregations
  const totalDonors = donors?.length ?? 0;
  const activeDonors = donors?.filter((d) => d.status === "פעיל").length ?? 0;
  const repeatDonors = donors?.filter((d) => d.totalDonated > 0).length ?? 0;
  const avgDonation =
    donors && donors.length > 0
      ? Math.round(donors.reduce((sum, d) => sum + d.totalDonated, 0) / donors.length)
      : 0;

  // Count meetings this month (type = "פגישה")
  const now = new Date();
  const thisMonth =
    interactions?.filter((i) => {
      const iDate = new Date(i.date);
      return (
        iDate.getMonth() === now.getMonth() &&
        iDate.getFullYear() === now.getFullYear() &&
        i.type === "פגישה"
      );
    }).length ?? 0;

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
              {
                name: "idNumber",
                label: "תעודת זהות / ח.פ.",
                required: true,
                maxLength: 9,
                pattern: /^\d{9}$/,
                patternMessage: "יש להזין 9 ספרות",
              },
              {
                name: "phone",
                label: "טלפון",
                type: "tel",
                required: true,
                maxLength: 10,
                pattern: /^\d{10}$/,
                patternMessage: "יש להזין 10 ספרות",
              },
              { name: "email", label: "אימייל", type: "email", required: true },
              {
                name: "type",
                label: "סוג תורם",
                type: "select",
                required: true,
                options: ["פרטי", "תאגיד", "קרן"],
              },
              { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
            ]}
            onCreate={async (v) => {
              try {
                await createDonor.mutateAsync({
                  name: v.name,
                  idNumber: v.idNumber || undefined,
                  phone: v.phone || undefined,
                  email: v.email || undefined,
                  type: v.type as DonorRecord["type"],
                  interests: [],
                  status: "פעיל",
                  totalDonated: 0,
                  lastDonation: "",
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
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">סה״כ תורמים</div>
          <div className="text-xl font-bold mt-1">{totalDonors}</div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">תורמים חוזרים</div>
          <div className="text-xl font-bold mt-1">{repeatDonors}</div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">תרומה ממוצעת</div>
          <div className="text-xl font-bold mt-1">₪{avgDonation.toLocaleString()}</div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">פגישות החודש</div>
          <div className="text-xl font-bold mt-1">{thisMonth}</div>
        </div>
      </div>
      {isLoading ? (
        <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> טוען תורמים...
        </div>
      ) : isError ? (
        <div className="card-elevated flex flex-col items-center gap-3 p-16 text-center">
          <div className="text-sm text-muted-foreground">אירעה שגיאה בטעינת התורמים.</div>
          <button onClick={() => refetch()} className="text-sm text-brand hover:underline">
            נסה שוב
          </button>
        </div>
      ) : (
        <DataTable
          rows={tableRows}
          columns={columns}
          searchKeys={["name", "idNumber", "phone", "email", "type"]}
          filters={filters}
          getRowHref={(r) => `/donor/${r.id}`}
          rowActions={(r) => (
            <div className="flex items-center justify-end gap-2">
              <DonorEditButton record={r} />
              <DonorDeleteButton record={r} />
            </div>
          )}
        />
      )}
    </>
  );
}
