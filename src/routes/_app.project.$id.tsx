import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowRight, Users, Wallet, Calendar, CheckCircle2, AlertTriangle, UserCheck, Truck, PiggyBank, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/page-header";
import { GanttChart } from "@/components/gantt-chart";
import { tasks, donations, volunteers, projectExpenses, projectPhases, projectParticipantCounts } from "@/lib/mock-data";
import { useProject } from "@/lib/queries/projects";
import { ProjectEditButton } from "@/components/module-edit-dialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/project/$id")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = useParams({ from: "/_app/project/$id" });
  const navigate = useNavigate();
  const { data: project, isLoading, isError, refetch } = useProject(id);

  if (isLoading) {
    return (
      <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> טוען פרויקט...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card-elevated flex flex-col items-center gap-3 p-16 text-center">
        <div className="text-sm text-muted-foreground">אירעה שגיאה בטעינת הפרויקט.</div>
        <button onClick={() => refetch()} className="text-sm text-brand hover:underline">נסה שוב</button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card-elevated p-12 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
        <div className="text-lg font-semibold">פרויקט לא נמצא</div>
        <div className="text-sm text-muted-foreground mt-1">ייתכן שהפרויקט נמחק או שהקישור שגוי.</div>
        <Button className="mt-4 bg-brand hover:bg-brand-deep" onClick={() => navigate({ to: "/projects" })}>
          חזרה לרשימה
        </Button>
      </div>
    );
  }

  const projectTasks = tasks.filter((t) => t.project === project.name);
  const projectDonations = donations.filter((d) => d.project === project.name || d.project.includes(project.name.split(" ")[0]));
  const projectVolunteers = volunteers.filter((v) => v.project === project.name || v.project.includes(project.name.split(" ")[0]));
  const expenses = projectExpenses[project.id] ?? [];
  const phases = projectPhases[project.id] ?? [];
  const participantsCount = projectParticipantCounts[project.id] ?? 0;
  const totalDonations = projectDonations.reduce((s, d) => s + d.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const remainingBudget = project.budget - project.spent;
  const budgetRatio = Math.round((project.spent / project.budget) * 100);
  const health = budgetRatio > 90 ? "סיכון" : project.progress < 30 ? "בהתנעה" : "תקין";

  // Expense by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const relatedSuppliers = Array.from(new Set(expenses.map((e) => e.supplier).filter(Boolean))) as string[];

  return (
    <>
      <Link to="/projects" className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline">
        <ArrowRight className="h-4 w-4" /> חזרה לרשימת הפרויקטים
      </Link>

      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-muted-foreground">{project.id} · מנהל/ת: {project.manager}</div>
            <h1 className="text-2xl font-bold mt-1">{project.name}</h1>
            <div className="flex items-center gap-2 mt-3">
              <StatusBadge value={project.status} />
              <StatusBadge value={health} />
            </div>
          </div>
          <div className="flex gap-2">
            <ProjectEditButton record={project} />
            <Button className="bg-brand hover:bg-brand-deep" onClick={() => toast.info("פתיחת דוח פרויקט")}>צור דוח</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <Metric icon={<Wallet className="h-4 w-4" />} label="תקציב" value={`₪${(project.budget/1000).toFixed(0)}K`} />
          <Metric icon={<Wallet className="h-4 w-4" />} label="בוצע" value={`₪${(project.spent/1000).toFixed(0)}K`} sub={`${budgetRatio}% ניצול`} tone={budgetRatio > 90 ? "danger" : "default"} />
          <Metric icon={<PiggyBank className="h-4 w-4" />} label="יתרת תקציב" value={`₪${(remainingBudget/1000).toFixed(0)}K`} tone={remainingBudget < 0 ? "danger" : "default"} />
          <Metric icon={<UserCheck className="h-4 w-4" />} label="נרשמים" value={String(participantsCount)} />
          <Metric icon={<Users className="h-4 w-4" />} label="מתנדבים" value={String(project.volunteers)} />
          <Metric icon={<Calendar className="h-4 w-4" />} label="התקדמות" value={`${project.progress}%`} />
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">התקדמות הפרויקט</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
      </div>

      {/* Financial breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-lg font-semibold">פירוט פיננסי</div>
              <div className="text-xs text-muted-foreground">הוצאות לפי ספק וקטגוריה · סה״כ ₪{totalExpenses.toLocaleString()}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => toast.success("ההוצאה נוספה לפרויקט")}>+ הוצאה</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="text-right py-2 font-medium">קטגוריה</th>
                  <th className="text-right py-2 font-medium">ספק</th>
                  <th className="text-right py-2 font-medium">תאריך</th>
                  <th className="text-right py-2 font-medium">סטטוס</th>
                  <th className="text-left py-2 font-medium">סכום</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-sm text-muted-foreground">טרם נרשמו הוצאות</td></tr>
                ) : expenses.map((e, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-surface-muted/50">
                    <td className="py-2 font-medium">{e.category}</td>
                    <td className="py-2 text-muted-foreground">{e.supplier ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{e.date}</td>
                    <td className="py-2"><StatusBadge value={e.status} /></td>
                    <td className="py-2 text-left font-semibold">₪{e.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Object.keys(byCategory).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs font-semibold text-muted-foreground mb-2">פילוח לפי קטגוריה</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(byCategory).map(([cat, amt]) => {
                  const pct = Math.round((amt / totalExpenses) * 100);
                  return (
                    <div key={cat} className="rounded-lg bg-surface-muted p-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{cat}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="text-sm font-semibold mt-0.5">₪{amt.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card-elevated p-5">
            <div className="font-semibold mb-2 flex items-center gap-1.5"><PiggyBank className="h-4 w-4 text-brand" /> תרומות לפרויקט</div>
            <div className="text-2xl font-bold text-brand-deep">₪{totalDonations.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{projectDonations.length} תרומות מיוחסות</div>
            <ul className="mt-3 space-y-1.5">
              {projectDonations.slice(0, 4).map((d) => (
                <li key={d.id}>
                  <Link to="/donation/$id" params={{ id: d.id }} className="flex items-center justify-between p-1.5 rounded-md hover:bg-surface-muted text-sm">
                    <span className="truncate">{d.donor}</span>
                    <span className="font-semibold">₪{d.amount.toLocaleString()}</span>
                  </Link>
                </li>
              ))}
              {projectDonations.length === 0 && <li className="text-xs text-muted-foreground">אין תרומות מיוחסות</li>}
            </ul>
          </div>

          <div className="card-elevated p-5">
            <div className="font-semibold mb-2 flex items-center gap-1.5"><Truck className="h-4 w-4 text-brand" /> ספקים קשורים ({relatedSuppliers.length})</div>
            {relatedSuppliers.length === 0 ? (
              <div className="text-xs text-muted-foreground">אין ספקים קשורים</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {relatedSuppliers.map((s) => (
                  <span key={s} className="text-xs bg-secondary text-brand-deep px-2 py-1 rounded-md font-medium">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gantt */}
      <div className="card-elevated p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold">לוח זמני פרויקט (Gantt)</div>
            <div className="text-xs text-muted-foreground">שלבים, אבני דרך, אחריות והתקדמות</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => toast.success("שלב חדש נוסף")}>+ שלב</Button>
        </div>
        {phases.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">טרם הוגדרו שלבים לפרויקט</div>
        ) : (
          <GanttChart phases={phases} />
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card-elevated p-5">
          <div className="font-semibold mb-3">מתנדבים משויכים ({projectVolunteers.length})</div>
          {projectVolunteers.length === 0 ? (
            <EmptyState text="אין מתנדבים משויכים" />
          ) : (
            <ul className="space-y-2">
              {projectVolunteers.map((v) => (
                <li key={v.id}>
                  <Link to="/volunteer/$id" params={{ id: v.id }} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted transition-colors">
                    <span className="text-sm font-medium">{v.name}</span>
                    <span className="text-xs text-muted-foreground">{v.hours} שעות</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-elevated p-5">
          <div className="font-semibold mb-3">תרומות קשורות ({projectDonations.length})</div>
          {projectDonations.length === 0 ? (
            <EmptyState text="טרם נרשמו תרומות" />
          ) : (
            <ul className="space-y-2">
              {projectDonations.map((d) => (
                <li key={d.id}>
                  <Link to="/donation/$id" params={{ id: d.id }} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted">
                    <span className="text-sm">{d.donor}</span>
                    <span className="text-sm font-semibold">₪{d.amount.toLocaleString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-elevated p-5">
          <div className="font-semibold mb-3">בריאות פרויקט</div>
          <ul className="space-y-2 text-sm">
            <HealthRow label="תקציב" ok={budgetRatio <= 90} msg={budgetRatio > 90 ? `ניצול ${budgetRatio}% — חריגה צפויה` : "במסגרת"} />
            <HealthRow label="מתנדבים" ok={project.volunteers >= 10} msg={project.volunteers >= 10 ? "מספיק כוח אדם" : "חוסר במתנדבים"} />
            <HealthRow label="לו״ז" ok={project.progress >= 30} msg={project.progress >= 30 ? "מתקדם לפי תכנון" : "בהתנעה"} />
            <HealthRow label="קבלות" ok={true} msg="כל הקבלות הופקו" />
          </ul>
        </div>
      </div>

      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">לוח משימות</div>
          <Button size="sm" variant="outline" onClick={() => toast.success("משימה חדשה נוספה")}>+ משימה</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["todo", "doing", "done"] as const).map((col) => {
            const labels = { todo: "לביצוע", doing: "בעבודה", done: "הושלם" };
            const items = projectTasks.filter((t) => t.column === col);
            return (
              <div key={col} className="bg-surface-muted rounded-xl p-3 min-h-[160px]">
                <div className="flex items-center justify-between px-1 pb-3">
                  <div className="text-sm font-semibold">{labels[col]}</div>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 border border-border">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">אין משימות</div>
                ) : (
                  <div className="space-y-2">
                    {items.map((t) => (
                      <div key={t.id} className="bg-white rounded-lg p-3 border border-border shadow-soft">
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{t.assignee}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Metric({ icon, label, value, sub, tone = "default" }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: "default" | "danger" }) {
  return (
    <div className={`rounded-lg p-4 border ${tone === "danger" ? "bg-rose-50 border-rose-200" : "bg-surface-muted border-border"}`}>
      <div className="text-xs text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
      {sub && <div className={`text-xs mt-0.5 ${tone === "danger" ? "text-rose-700" : "text-muted-foreground"}`}>{sub}</div>}
    </div>
  );
}

function HealthRow({ label, ok, msg }: { label: string; ok: boolean; msg: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
      <span className="font-medium">{label}:</span>
      <span className="text-muted-foreground">{msg}</span>
    </li>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center text-sm text-muted-foreground py-6">{text}</div>;
}
