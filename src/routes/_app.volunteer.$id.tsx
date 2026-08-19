import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Clock, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/page-header";
import { useVolunteer } from "@/lib/queries/volunteers";
import { useProjects } from "@/lib/queries/projects";
import { VolunteerEditButton } from "@/components/module-edit-dialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/volunteer/$id")({
  component: VolunteerDetail,
});

function VolunteerDetail() {
  const { id } = useParams({ from: "/_app/volunteer/$id" });
  const { data: v, isLoading, isError } = useVolunteer(id);
  const { data: projects } = useProjects();
  if (isLoading) return <div className="card-elevated p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline-block" /></div>;
  if (isError || !v) return <div className="card-elevated p-8 text-center">מתנדב לא נמצא. <Link to="/volunteers" className="text-brand">חזרה</Link></div>;
  const project = (projects ?? []).find((p) => p.name === v.project || v.project.includes(p.name.split(" ")[0]));

  return (
    <>
      <Link to="/volunteers" className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline">
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
              <div className="text-sm text-muted-foreground mt-1">{v.id} · זמינות: {v.availability}</div>
              <div className="mt-2"><StatusBadge value={v.status} /></div>
            </div>
          </div>
          <div className="flex gap-2">
            <VolunteerEditButton record={v} />
            <Button variant="outline" onClick={() => toast.success("המתנדב שובץ מחדש")}>שייך לפרויקט</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> שעות החודש</div>
            <div className="text-xl font-bold mt-1">{v.hours}</div>
            {v.hours > 100 && <div className="text-xs text-amber-700 mt-1">⚠ עומס פעילות</div>}
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground">פרויקט פעיל</div>
            {project ? (
              <Link to="/project/$id" params={{ id: project.id }} className="text-base font-bold mt-1 text-brand hover:underline block">
                {project.name}
              </Link>
            ) : (
              <div className="text-base font-bold mt-1">{v.project}</div>
            )}
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Award className="h-4 w-4" /> כישורים</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {v.skills.map((s) => <span key={s} className="text-xs bg-white border border-border px-2 py-0.5 rounded-full">{s}</span>)}
            </div>
          </div>
          <div className="bg-surface-muted rounded-lg p-4">
            <div className="text-xs text-muted-foreground">סטטוס</div>
            <div className="text-base font-bold mt-1">{v.status}</div>
          </div>
        </div>
      </div>

      <div className="card-elevated p-5">
        <div className="text-lg font-semibold mb-3">פעילות אחרונה</div>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between p-3 bg-surface-muted rounded-lg"><span>השתתפות בפעילות שבועית</span><span className="text-muted-foreground">לפני 2 ימים</span></li>
          <li className="flex justify-between p-3 bg-surface-muted rounded-lg"><span>השתתפות בהדרכת מתנדבים</span><span className="text-muted-foreground">לפני שבוע</span></li>
          <li className="flex justify-between p-3 bg-surface-muted rounded-lg"><span>שיוך לפרויקט {v.project}</span><span className="text-muted-foreground">לפני חודש</span></li>
        </ul>
      </div>
    </>
  );
}
