import { createFileRoute } from "@tanstack/react-router";
import { Award, Loader2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { useProjects } from "@/lib/queries/projects";
import { useVolunteers, useCreateVolunteer, type VolunteerRecord } from "@/lib/queries/volunteers";
import { VolunteerEditButton, VolunteerDeleteButton } from "@/components/module-edit-dialogs";

const UNASSIGNED = "ללא שיוך";

export const Route = createFileRoute("/_app/volunteers")({
  component: VolunteersPage,
});

const columns: Column<VolunteerRecord>[] = [
  { key: "name", header: "שם", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "availability", header: "זמינות" },
  { key: "project", header: "פרויקט משויך" },
  {
    key: "hours",
    header: "שעות התנדבות",
    render: (r) => <span className="tabular-nums">{r.hours}</span>,
  },
  {
    key: "skills",
    header: "כישורים",
    render: (r) => (
      <div className="flex flex-wrap gap-1">
        {r.skills.map((s) => (
          <span key={s} className="text-xs bg-secondary text-brand-deep px-2 py-0.5 rounded-full">
            {s}
          </span>
        ))}
      </div>
    ),
  },
  { key: "status", header: "סטטוס", render: (r) => <StatusBadge value={r.status} /> },
];

function VolunteersPage() {
  const { data: volunteers, isLoading, isError, refetch } = useVolunteers();
  const { data: projects } = useProjects();
  const createVolunteer = useCreateVolunteer();
  const projectOptions = [...(projects ?? []).map((p) => p.name), UNASSIGNED];

  return (
    <>
      <PageHeader
        title="ניהול מתנדבים"
        description="מאגר מתנדבים, שיוך לפרויקטים, מעקב שעות וכישורים."
        actions={
          <EntityFormDialog
            triggerLabel="הוסף מתנדב"
            title="הוספת מתנדב חדש"
            description="הזן את פרטי המתנדב לצירוף למאגר."
            successMessage="מתנדב חדש נוסף בהצלחה"
            fields={[
              { name: "fullName", label: "שם מלא", required: true },
              { name: "phone", label: "טלפון", type: "tel", required: true },
              {
                name: "availability",
                label: "זמינות",
                type: "select",
                required: true,
                options: ["בוקר", "צהריים", "ערב", "סופי שבוע", "גמיש"],
              },
              { name: "project", label: "פרויקט משויך", type: "select", options: projectOptions },
              {
                name: "skills",
                label: "כישורים",
                colSpan: 2,
                placeholder: "הדרכה, נהיגה, תרגום...",
              },
            ]}
            onCreate={async (v) => {
              const def = (projects ?? []).find((p) => p.name === v.project);
              try {
                await createVolunteer.mutateAsync({
                  name: v.fullName,
                  phone: v.phone || undefined,
                  availability: v.availability,
                  projectId: def?.id,
                  hours: 0,
                  status: "פעיל",
                  skills: v.skills
                    ? v.skills
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : [],
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
          <div className="text-xs text-muted-foreground">מתנדבים פעילים</div>
          <div className="text-xl font-bold mt-1">186</div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">שעות החודש</div>
          <div className="text-xl font-bold mt-1">3,240</div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">פרויקטים פעילים</div>
          <div className="text-xl font-bold mt-1">14</div>
        </div>
        <div className="card-elevated p-4 bg-soft-gradient flex items-center gap-3">
          <Award className="h-8 w-8 text-brand-deep" />
          <div>
            <div className="text-xs text-muted-foreground">מתנדב/ת החודש</div>
            <div className="text-sm font-bold">פאדי נסר</div>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> טוען מתנדבים...
        </div>
      ) : isError ? (
        <div className="card-elevated flex flex-col items-center gap-3 p-16 text-center">
          <div className="text-sm text-muted-foreground">אירעה שגיאה בטעינת המתנדבים.</div>
          <button onClick={() => refetch()} className="text-sm text-brand hover:underline">
            נסה שוב
          </button>
        </div>
      ) : (
        <DataTable
          rows={volunteers ?? []}
          columns={columns}
          searchKeys={["name", "project", "availability"]}
          getRowHref={(r) => `/volunteer/${r.id}`}
          rowActions={(r) => (
            <div className="flex items-center justify-end gap-2">
              <VolunteerEditButton record={r} />
              <VolunteerDeleteButton record={r} />
            </div>
          )}
        />
      )}
    </>
  );
}
