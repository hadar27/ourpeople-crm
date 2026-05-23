import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { Progress } from "@/components/ui/progress";
import { projects, tasks } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="ניהול פרויקטים"
        description="מבט כולל על כל הפרויקטים — סטטוס, תקציב, התקדמות ומשימות."
        actions={
          <Button className="bg-brand hover:bg-brand-deep gap-1" onClick={() => toast.success("פרויקט חדש נוצר בהצלחה")}>
            <Plus className="h-4 w-4" /> פרויקט חדש
          </Button>
        }
      />

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {projects.map((p) => (
          <Link
            key={p.id}
            to="/project/$id"
            params={{ id: p.id }}
            className="card-elevated p-5 hover:shadow-card hover:-translate-y-0.5 transition-all block"
          >
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{p.id} · מנהל/ת: {p.manager}</div>
                <div className="text-base font-bold truncate mt-0.5">{p.name}</div>
              </div>
              <StatusBadge value={p.status} />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">התקדמות</span>
                <span className="font-medium">{p.progress}%</span>
              </div>
              <Progress value={p.progress} className="h-2" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-surface-muted p-2">
                <div className="text-muted-foreground">תקציב</div>
                <div className="font-semibold mt-0.5">₪{(p.budget / 1000).toFixed(0)}K</div>
              </div>
              <div className="rounded-lg bg-surface-muted p-2">
                <div className="text-muted-foreground">בוצע</div>
                <div className="font-semibold mt-0.5">₪{(p.spent / 1000).toFixed(0)}K</div>
          </Link>
              <div className="rounded-lg bg-surface-muted p-2 flex flex-col">
                <div className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> מתנדבים</div>
                <div className="font-semibold mt-0.5">{p.volunteers}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" /> לוח משימות (Kanban)</div>
            <div className="text-xs text-muted-foreground">משימות פתוחות בין הפרויקטים הפעילים</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["todo", "doing", "done"] as const).map((col) => {
            const labels = { todo: "לביצוע", doing: "בעבודה", done: "הושלם" };
            const items = tasks.filter((t) => t.column === col);
            return (
              <div key={col} className="bg-surface-muted rounded-xl p-3 min-h-[280px]">
                <div className="flex items-center justify-between px-1 pb-3">
                  <div className="text-sm font-semibold">{labels[col]}</div>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 border border-border">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="bg-white rounded-lg p-3 border border-border shadow-soft">
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t.project}</div>
                      <div className="text-xs mt-2 flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-brand/15 text-brand text-[10px] flex items-center justify-center">
                          {t.assignee.charAt(0)}
                        </span>
                        <span className="text-muted-foreground">{t.assignee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
