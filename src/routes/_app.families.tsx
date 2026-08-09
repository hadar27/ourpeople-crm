import { createFileRoute } from "@tanstack/react-router";
import { Users, HeartHandshake, AlertTriangle, HandHeart, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { FormDialog } from "@/components/form-dialog";
import { useFamilies, useCreateFamily, type FamilyRecord } from "@/lib/queries/families";
import { useAllAssistance } from "@/lib/queries/assistance";
import type { AssistanceNeed, FamilyStatus } from "@/lib/crm-types";
import { FamilyEditButton } from "@/components/module-edit-dialogs";

export const Route = createFileRoute("/_app/families")({
  component: FamiliesPage,
  head: () => ({
    meta: [
      { title: "מוטבים ומשפחות | Our People" },
      { name: "description", content: "ניהול משפחות מוטבות, בני משפחה, צרכים והיסטוריית סיוע במערכת Our People." },
      { property: "og:title", content: "מוטבים ומשפחות | Our People" },
      { property: "og:description", content: "מעקב אחר משפחות בטיפול, סוגי סיוע והיקפי תמיכה." },
    ],
  }),
});

const NEEDS: AssistanceNeed[] = ["מזון", "דיור", "תעסוקה", "חינוך", "בריאות", "משפטי", "ריהוט", "עברית"];

const columns: Column<Record<string, unknown>>[] = [
  { key: "familyName", header: "שם המשפחה", render: (r) => <span className="font-medium">{String(r.familyName)}</span> },
  { key: "mainContact", header: "איש קשר" },
  { key: "city", header: "יישוב" },
  { key: "countryOfOrigin", header: "ארץ מוצא" },
  { key: "membersCount", header: "נפשות", render: (r) => <span className="tabular-nums">{String(r.membersCount)}</span> },
  {
    key: "needs",
    header: "צרכים",
    render: (r) => (
      <div className="flex flex-wrap gap-1">
        {(r.needs as string[]).map((n) => (
          <span key={n} className="text-xs bg-secondary text-brand-deep px-2 py-0.5 rounded-full">
            {n}
          </span>
        ))}
      </div>
    ),
  },
  { key: "assignedStaff", header: "רכז/ת מלווה" },
  { key: "status", header: "סטטוס", render: (r) => <StatusBadge value={String(r.status)} /> },
];

function FamiliesPage() {
  const { data: families, isLoading, isError, refetch } = useFamilies();
  const { data: assistance } = useAllAssistance();
  const createFamily = useCreateFamily();
  const list = families ?? [];

  const active = list.filter((f) => f.status === "בטיפול פעיל" || f.status === "מלווה").length;
  const atRisk = list.filter((f) => f.status === "בסיכון").length;
  const people = list.reduce((s, f) => s + f.membersCount, 0);
  const totalAid = (assistance ?? []).filter((a) => a.status !== "נדחה").reduce((s, a) => s + (a.amount ?? 0), 0);

  const handleAdd = async (v: Record<string, string>) => {
    try {
      await createFamily.mutateAsync({
        familyName: v.familyName,
        mainContact: v.mainContact,
        phone: v.phone,
        email: v.email || undefined,
        city: v.city,
        countryOfOrigin: v.countryOfOrigin,
        immigrationDate: v.immigrationDate || "—",
        membersCount: Number(v.membersCount || 1),
        needs: (v.needs ? v.needs.split(",").map((n) => n.trim()) : []).filter((n) =>
          (NEEDS as string[]).includes(n),
        ) as AssistanceNeed[],
        status: (v.status as FamilyStatus) ?? "ממתינה לאישור",
        assignedStaff: v.assignedStaff,
        notes: v.notes || undefined,
      });
    } catch (err) {
      return err instanceof Error ? err.message : "השמירה נכשלה";
    }
  };

  return (
    <>
      <PageHeader
        title="מוטבים ומשפחות"
        description="תיק משפחה מלא — בני משפחה, צרכים, היסטוריית סיוע ומסמכים."
        actions={
          <FormDialog
            trigger={
              <Button className="bg-brand hover:bg-brand-deep gap-1">
                <Plus className="h-4 w-4" /> הוסף משפחה
              </Button>
            }
            title="פתיחת תיק משפחה"
            description="רישום משפחה חדשה למאגר המוטבים."
            successMessage="תיק משפחה נפתח בהצלחה"
            fields={[
              { name: "familyName", label: "שם המשפחה", required: true },
              { name: "mainContact", label: "איש קשר ראשי", required: true },
              { name: "phone", label: "טלפון", type: "tel", required: true, maxLength: 10, helper: "10 ספרות" },
              { name: "email", label: "אימייל", type: "email" },
              { name: "city", label: "יישוב", required: true },
              { name: "countryOfOrigin", label: "ארץ מוצא", required: true },
              { name: "immigrationDate", label: "תאריך עלייה", type: "date" },
              { name: "membersCount", label: "מספר נפשות", type: "number", required: true },
              { name: "assignedStaff", label: "רכז/ת מלווה", required: true },
              {
                name: "status",
                label: "סטטוס",
                type: "select",
                required: true,
                options: ["ממתינה לאישור", "בטיפול פעיל", "מלווה", "בסיכון", "סגורה"],
              },
              { name: "needs", label: "צרכים", colSpan: 2, placeholder: NEEDS.join(", "), helper: "הפרדה בפסיקים" },
              { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
            ]}
            onSubmit={handleAdd}
          />
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="תיקי משפחה" value={String(list.length)} icon={<HeartHandshake className="h-4 w-4" />} />
        <Kpi label="בטיפול פעיל" value={String(active)} icon={<HandHeart className="h-4 w-4" />} />
        <Kpi label="נפשות בטיפול" value={String(people)} icon={<Users className="h-4 w-4" />} />
        <Kpi
          label="משפחות בסיכון"
          value={String(atRisk)}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="danger"
        />
      </div>

      <div className="card-elevated p-4 mb-6 flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">סך סיוע כספי שאושר או סופק השנה</div>
        <div className="text-xl font-bold">₪{totalAid.toLocaleString()}</div>
      </div>

      {isLoading ? (
        <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> טוען משפחות...
        </div>
      ) : isError ? (
        <div className="card-elevated flex flex-col items-center gap-3 p-16 text-center">
          <div className="text-sm text-muted-foreground">אירעה שגיאה בטעינת המשפחות.</div>
          <button onClick={() => refetch()} className="text-sm text-brand hover:underline">נסה שוב</button>
        </div>
      ) : (
        <DataTable
          rowActions={(r) => <FamilyEditButton record={r as unknown as FamilyRecord} />}
          rows={list as unknown as Record<string, unknown>[]}
          columns={columns}
          searchKeys={["familyName", "mainContact", "city", "countryOfOrigin", "assignedStaff"]}
          getRowHref={(r) => `/families/${String(r.id)}`}
        />
      )}
    </>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <div className="card-elevated p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={`text-xl font-bold mt-1 ${tone === "danger" ? "text-rose-600" : ""}`}>{value}</div>
    </div>
  );
}
