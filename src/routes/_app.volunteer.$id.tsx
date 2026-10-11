import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { StatusBadge } from "@/components/page-header";
import { useVolunteer } from "@/lib/queries/volunteers";
import { VolunteerEditButton } from "@/components/module-edit-dialogs";
import { EntityDocumentsPanel } from "@/components/entity-documents-panel";
import { ModuleAccessDenied } from "@/components/module-access-denied";
import { useCanView } from "@/lib/permissions";

export const Route = createFileRoute("/_app/volunteer/$id")({
  component: VolunteerDetail,
});

function VolunteerDetail() {
  const canAccess = useCanView("volunteers");
  const { id } = useParams({ from: "/_app/volunteer/$id" });
  const { data: v, isLoading, isError } = useVolunteer(id);
  if (!canAccess) return <ModuleAccessDenied title="כרטיס מתנדב" />;
  if (isLoading)
    return (
      <div className="card-elevated p-8 text-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin inline-block" />
      </div>
    );
  if (isError || !v)
    return (
      <div className="card-elevated p-8 text-center">
        מתנדב לא נמצא.{" "}
        <Link to="/volunteers" className="text-brand">
          חזרה
        </Link>
      </div>
    );
  return (
    <>
      <Link
        to="/volunteers"
        className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline"
      >
        <ArrowRight className="h-4 w-4" /> חזרה למתנדבים
      </Link>

      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-gradient text-white text-2xl font-bold flex items-center justify-center">
              {v.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{v.name}</h1>
              <div className="text-sm text-muted-foreground mt-1">
                {v.id} · זמינות: {v.availability}
              </div>
              <div className="mt-2">
                <StatusBadge value={v.status} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <VolunteerEditButton record={v} />
            {/* <Button variant="outline" onClick={() => toast.success("המתנדב שובץ מחדש")}>שייך לפרויקט</Button> */}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <UserRound className="h-4 w-4" /> תעודת זהות
            </div>
            <div className="text-base font-bold mt-1">
              {v.idNumber || "לא הוזנה"}
            </div>
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-4 w-4" /> טלפון
            </div>
            <div className="text-base font-bold mt-1" dir="ltr">
              {v.phone || "לא הוזן"}
            </div>
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-4 w-4" /> דוא״ל
            </div>
            <div className="text-sm font-bold mt-1 break-all" dir="ltr">
              {v.email || "לא הוזן"}
            </div>
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground">זמינות</div>
            <div className="text-base font-bold mt-1">
              {v.availability || "לא הוזנה"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Award className="h-4 w-4" /> כישורים
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {v.skills.length ? (
                v.skills.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-white border border-border px-2 py-0.5 rounded-full"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  לא הוזנו כישורים
                </span>
              )}
            </div>
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground">סטטוס</div>
            <div className="text-base font-bold mt-1">{v.status}</div>
          </div>
        </div>
        {v.notes && (
          <div className="bg-surface-muted rounded-lg p-4 mt-4">
            <div className="text-xs text-muted-foreground">הערות</div>
            <div className="text-sm mt-1 whitespace-pre-wrap">{v.notes}</div>
          </div>
        )}
      </div>

      <div className="card-elevated p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-brand" /> פרויקטים משויכים
        </h2>
        {v.projects.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {v.projects.map((project) => (
              <Link
                key={project.id}
                to="/project/$id"
                params={{ id: project.id }}
                className="rounded-lg border border-border p-4 hover:bg-surface-muted transition-colors"
              >
                <div className="font-semibold text-brand">{project.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {project.startDate || "תאריך התחלה לא נקבע"} –{" "}
                  {project.endDate || "תאריך סיום לא נקבע"}
                </div>
                {project.status && (
                  <div className="mt-2">
                    <StatusBadge value={project.status} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            המתנדב אינו משויך לפרויקט.
          </div>
        )}
      </div>

      <div className="mb-6">
        <EntityDocumentsPanel entityType="volunteer" entityId={v.id} />
      </div>

      <div className="card-elevated p-5">
        <div className="text-lg font-semibold mb-3">פעילות אחרונה</div>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between p-3 bg-surface-muted rounded-lg">
            <span>השתתפות בפעילות שבועית</span>
            <span className="text-muted-foreground">לפני 2 ימים</span>
          </li>
          <li className="flex justify-between p-3 bg-surface-muted rounded-lg">
            <span>השתתפות בהדרכת מתנדבים</span>
            <span className="text-muted-foreground">לפני שבוע</span>
          </li>
          <li className="flex justify-between p-3 bg-surface-muted rounded-lg">
            <span>שיוך לפרויקט {v.project}</span>
            <span className="text-muted-foreground">לפני חודש</span>
          </li>
        </ul>
      </div>
    </>
  );
}
