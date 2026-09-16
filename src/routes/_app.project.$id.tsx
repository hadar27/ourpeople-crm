import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Users,
  Wallet,
  Calendar,
  AlertTriangle,
  UserCheck,
  PiggyBank,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecordEditDialog } from "@/components/record-edit-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/page-header";
import { GanttChart } from "@/components/gantt-chart";
import { useProject, useUpdateProject, type ProjectRecord } from "@/lib/queries/projects";
import { useDonations } from "@/lib/queries/donations";
import { useAllAllocations } from "@/lib/queries/allocations";
import {
  useAssignVolunteerToProject,
  useProjectVolunteerIds,
  useVolunteers,
} from "@/lib/queries/volunteers";
import {
  useParticipants,
  useProjectParticipantIds,
  useAssignParticipantToProject,
} from "@/lib/queries/participants";
import { useCreateTask, useTasksForProject } from "@/lib/queries/tasks";
import {
  useProjectExpenses,
  useCreateProjectExpense,
  useUpdateProjectExpense,
  useDeleteProjectExpense,
} from "@/lib/queries/project-expenses";
import { useProjectPhases } from "@/lib/queries/project-phases";
import { useSuppliers } from "@/lib/queries/suppliers";
import {
  usePendingVolunteerRegistrations,
  usePendingParticipantRegistrations,
} from "@/lib/queries/pending-registrations";
import { ProjectEditButton } from "@/components/module-edit-dialogs";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { projectExpenseFields } from "@/lib/edit-forms";
import { RegistrationLinksSection } from "@/components/registration-links-section";
import { ApproveRegistrationsModal } from "@/components/approve-registrations-modal";
import { useCanEdit } from "@/lib/permissions";

export const Route = createFileRoute("/_app/project/$id")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = useParams({ from: "/_app/project/$id" });
  const navigate = useNavigate();
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const { data: project, isLoading, isError, refetch } = useProject(id);
  const { data: tasksData } = useTasksForProject(project?.id);
  const { data: expensesData } = useProjectExpenses(project?.id);
  const { data: phasesData } = useProjectPhases(project?.id);
  const { data: donationsData } = useDonations();
  const { data: allocationsData } = useAllAllocations();
  const { data: volunteersData } = useVolunteers();
  const { data: projectVolunteerIdsData } = useProjectVolunteerIds(id);
  const { data: participantsData } = useParticipants();
  const { data: projectParticipantIdsData } = useProjectParticipantIds(id);
  const { data: pendingVolunteers } = usePendingVolunteerRegistrations(id);
  const { data: pendingParticipants } = usePendingParticipantRegistrations(id);
  const { data: suppliersData } = useSuppliers();
  const canViewDonations = useCanEdit("donations");
  const canEditProjects = useCanEdit("projects");
  const createProjectExpense = useCreateProjectExpense();
  const updateProjectExpense = useUpdateProjectExpense();
  const deleteProjectExpense = useDeleteProjectExpense();
  const createTask = useCreateTask();
  const assignVolunteer = useAssignVolunteerToProject();
  const assignParticipant = useAssignParticipantToProject();

  const pendingVolunteersCount = pendingVolunteers?.length ?? 0;
  const pendingParticipantsCount = pendingParticipants?.length ?? 0;
  const totalPending = pendingVolunteersCount + pendingParticipantsCount;

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
        <button onClick={() => refetch()} className="text-sm text-brand hover:underline">
          נסה שוב
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card-elevated p-12 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
        <div className="text-lg font-semibold">פרויקט לא נמצא</div>
        <div className="text-sm text-muted-foreground mt-1">
          ייתכן שהפרויקט נמחק או שהקישור שגוי.
        </div>
        <Button
          className="mt-4 bg-brand hover:bg-brand-deep"
          onClick={() => navigate({ to: "/projects" })}
        >
          חזרה לרשימה
        </Button>
      </div>
    );
  }

  const projectTasks = tasksData ?? [];
  const allocations = allocationsData ?? [];
  const allocatedDonationIds = new Set(allocations.map((allocation) => allocation.donationId));
  const projectAllocationAmounts = allocations
    .filter((allocation) => allocation.projectId === project.id)
    .reduce((amounts, allocation) => {
      amounts.set(
        allocation.donationId,
        (amounts.get(allocation.donationId) ?? 0) + allocation.amount,
      );
      return amounts;
    }, new Map<string, number>());
  const projectDonations = (donationsData ?? []).filter(
    (donation) =>
      projectAllocationAmounts.has(donation.id) ||
      (donation.projectId === project.id && !allocatedDonationIds.has(donation.id)),
  );
  const projectVolunteerIds = new Set(projectVolunteerIdsData ?? []);
  const projectVolunteers = (volunteersData ?? []).filter(
    (v) => projectVolunteerIds.has(v.id) || v.projectId === project.id,
  );
  const availableVolunteers = (volunteersData ?? []).filter(
    (v) => v.status === "פעיל" && !projectVolunteerIds.has(v.id) && v.projectId !== project.id,
  );
  const expenses = expensesData ?? [];
  const phases = phasesData ?? [];
  const projectParticipantIds = new Set(projectParticipantIdsData ?? []);
  const projectParticipants = (participantsData ?? []).filter(
    (participant) =>
      projectParticipantIds.has(participant.id) || participant.projectId === project.id,
  );
  const availableParticipants = (participantsData ?? []).filter(
    (participant) =>
      !projectParticipantIds.has(participant.id) && participant.projectId !== project.id,
  );
  const participantsCount = projectParticipants.length;
  const donationAmountForProject = (donationId: string, originalAmount: number) =>
    projectAllocationAmounts.get(donationId) ?? originalAmount;
  const totalDonations = projectDonations.reduce(
    (sum, donation) => sum + donationAmountForProject(donation.id, donation.amount),
    0,
  );
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const remainingBudget = project.budget - project.spent;
  const budgetRatio = Math.round((project.spent / project.budget) * 100);
  const ganttItems = [
    ...phases,
    ...projectTasks
      .filter((task) => task.startDate && task.endDate)
      .map((task) => ({
        id: `task-${task.id}`,
        name: `משימה: ${task.title}`,
        owner: task.assignee,
        start: task.startDate!,
        end: task.endDate!,
        progress: task.column === "done" ? 100 : task.column === "doing" ? 50 : 0,
      })),
  ];

  // Expense by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const relatedSuppliers = Array.from(
    new Set(expenses.map((e) => e.supplier).filter(Boolean)),
  ) as string[];

  return (
    <>
      <Link
        to="/projects"
        className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline"
      >
        <ArrowRight className="h-4 w-4" /> חזרה לרשימת הפרויקטים
      </Link>

      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-muted-foreground">
              {project.id} · מנהל/ת: {project.manager}
            </div>
            <h1 className="text-2xl font-bold mt-1">{project.name}</h1>
            <div className="flex items-center gap-2 mt-3">
              <StatusBadge value={project.status} />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>תאריך התחלה: {project.startDate || "לא נקבע"}</span>
              <span>·</span>
              <span>תאריך סיום: {project.endDate || "לא נקבע"}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <ProjectEditButton record={project} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <Metric
            icon={<Wallet className="h-4 w-4" />}
            label="תקציב"
            value={`₪${(project.budget / 1000).toFixed(0)}K`}
          />
          <Metric
            icon={<Wallet className="h-4 w-4" />}
            label="בוצע"
            value={`₪${(project.spent / 1000).toFixed(0)}K`}
            sub={`${budgetRatio}% ניצול`}
            tone={budgetRatio > 90 ? "danger" : "default"}
          />
          <Metric
            icon={<PiggyBank className="h-4 w-4" />}
            label="יתרת תקציב"
            value={`₪${(remainingBudget / 1000).toFixed(0)}K`}
            tone={remainingBudget < 0 ? "danger" : "default"}
          />
          <Metric
            icon={<UserCheck className="h-4 w-4" />}
            label="נרשמים"
            value={String(participantsCount)}
          />
          <Metric
            icon={<Users className="h-4 w-4" />}
            label="מתנדבים"
            value={String(projectVolunteers.length)}
          />
          <Metric
            icon={<Calendar className="h-4 w-4" />}
            label="התקדמות"
            value={`${project.progress}%`}
          />
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
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-lg font-semibold">פירוט פיננסי</div>
              <div className="text-xs text-muted-foreground">
                הוצאות לפי ספק וקטגוריה · סה״כ ₪{totalExpenses.toLocaleString()}
              </div>
            </div>
            {canEditProjects && (
              <EntityFormDialog
                triggerLabel="הוצאה"
                triggerNode={
                  <Button size="sm" variant="outline">
                    + הוצאה
                  </Button>
                }
                title="הוספת הוצאה לפרויקט"
                description="רישום הוצאה חדשה על חשבון הפרויקט."
                successMessage="ההוצאה נוספה לפרויקט"
                fields={projectExpenseFields}
                customValidate={(v) => {
                  const amount = Number(v.amount);
                  if (!(amount > 0)) return "יש להזין סכום חיובי.";
                  if (totalExpenses + amount > project.budget) {
                    return "סכום ההוצאה חורג מתקציב הפרויקט.";
                  }
                  return null;
                }}
                onCreate={async (v) => {
                  const supplier = (suppliersData ?? []).find((s) => s.name === v.supplier);
                  try {
                    await createProjectExpense.mutateAsync({
                      projectId: project.id,
                      category: v.category,
                      amount: Number(v.amount),
                      date: v.date,
                      supplierId: supplier?.id,
                      status: v.status as "שולם" | "ממתין" | "חלקי",
                      description: v.description,
                      reference: v.reference,
                    });
                    return { ok: true };
                  } catch (err) {
                    return {
                      ok: false,
                      error: err instanceof Error ? err.message : "שמירת ההוצאה נכשלה",
                    };
                  }
                }}
              />
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="text-right py-2 font-medium">קטגוריה</th>
                  <th className="text-right py-2 font-medium">ספק</th>
                  <th className="text-right py-2 font-medium">תאריך</th>
                  <th className="text-right py-2 font-medium">תיאור / אסמכתא</th>
                  <th className="text-right py-2 font-medium">סטטוס</th>
                  <th className="text-left py-2 font-medium">סכום</th>
                  {canEditProjects && <th className="text-left py-2 font-medium">פעולות</th>}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canEditProjects ? 7 : 6}
                      className="text-center py-6 text-sm text-muted-foreground"
                    >
                      טרם נרשמו הוצאות
                    </td>
                  </tr>
                ) : (
                  expenses.map((e, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-surface-muted/50">
                      <td className="py-2 font-medium">{e.category}</td>
                      <td className="py-2 text-muted-foreground">{e.supplier ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{e.date}</td>
                      <td className="py-2 text-muted-foreground">
                        {e.description ?? "—"}
                        {e.reference ? ` · ${e.reference}` : ""}
                      </td>
                      <td className="py-2">
                        <StatusBadge value={e.status} />
                      </td>
                      <td className="py-2 text-left font-semibold">₪{e.amount.toLocaleString()}</td>
                      {canEditProjects && (
                        <td className="py-2 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <RecordEditDialog
                              triggerLabel="עריכה"
                              title="עריכת הוצאה"
                              description="עדכון פירוט ההוצאה, הספק, האסמכתא וסטטוס התשלום."
                              fields={projectExpenseFields.map((field) =>
                                field.name === "supplier"
                                  ? {
                                      ...field,
                                      type: "select" as const,
                                      options: (suppliersData ?? []).map(
                                        (supplier) => supplier.name,
                                      ),
                                    }
                                  : field,
                              )}
                              initialValues={{
                                category: e.category,
                                amount: String(e.amount),
                                date: e.date,
                                supplier: e.supplier ?? "",
                                status: e.status,
                                description: e.description ?? "",
                                reference: e.reference ?? "",
                              }}
                              customValidate={(values) => {
                                const amount = Number(values.amount);
                                if (!(amount > 0)) return "יש להזין סכום חיובי.";
                                if (totalExpenses - e.amount + amount > project.budget) {
                                  return "סכום ההוצאה חורג מתקציב הפרויקט.";
                                }
                                return null;
                              }}
                              onSave={async (values) => {
                                const supplier = (suppliersData ?? []).find(
                                  (item) => item.name === values.supplier,
                                );
                                try {
                                  await updateProjectExpense.mutateAsync({
                                    id: e.id,
                                    patch: {
                                      category: values.category,
                                      amount: Number(values.amount),
                                      date: values.date,
                                      supplierId: supplier?.id ?? null,
                                      status: values.status as "שולם" | "ממתין" | "חלקי",
                                      description: values.description,
                                      reference: values.reference,
                                    },
                                  });
                                  return { ok: true };
                                } catch (error) {
                                  return {
                                    ok: false,
                                    error:
                                      error instanceof Error ? error.message : "עדכון ההוצאה נכשל",
                                  };
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600 hover:text-rose-700"
                              onClick={async () => {
                                if (
                                  !window.confirm("למחוק את ההוצאה? הפעולה תעדכן גם את התקציב.")
                                ) {
                                  return;
                                }
                                try {
                                  await deleteProjectExpense.mutateAsync(e);
                                  toast.success("ההוצאה נמחקה והתקציב עודכן");
                                } catch (error) {
                                  toast.error(
                                    error instanceof Error ? error.message : "מחיקת ההוצאה נכשלה",
                                  );
                                }
                              }}
                            >
                              מחיקה
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {Object.keys(byCategory).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                פילוח לפי קטגוריה
              </div>
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

        {/* <div className="space-y-4">
          {canViewDonations && (
            <div className="card-elevated p-5">
              <div className="font-semibold mb-2 flex items-center gap-1.5">
                <PiggyBank className="h-4 w-4 text-brand" /> תרומות לפרויקט
              </div>
              <div className="text-2xl font-bold text-brand-deep">
                ₪{totalDonations.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {projectDonations.length} תרומות מיוחסות
              </div>
              <ul className="mt-3 space-y-1.5">
                {projectDonations.slice(0, 4).map((d) => (
                  <li key={d.id}>
                    <Link
                      to="/donation/$id"
                      params={{ id: d.id }}
                      className="flex items-center justify-between p-1.5 rounded-md hover:bg-surface-muted text-sm"
                    >
                      <span className="truncate">{d.donor}</span>
                      <span className="font-semibold">₪{d.amount.toLocaleString()}</span>
                    </Link>
                  </li>
                ))}
                {projectDonations.length === 0 && (
                  <li className="text-xs text-muted-foreground">אין תרומות מיוחסות</li>
                )}
              </ul>
            </div>
          )}

          <div className="card-elevated p-5">
            <div className="font-semibold mb-2 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-brand" /> ספקים קשורים ({relatedSuppliers.length})
            </div>
            {relatedSuppliers.length === 0 ? (
              <div className="text-xs text-muted-foreground">אין ספקים קשורים</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {relatedSuppliers.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-secondary text-brand-deep px-2 py-1 rounded-md font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div> */}
      </div>

      {/* Gantt */}
      <div className="card-elevated p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold">לוח זמני פרויקט (Gantt)</div>
            <div className="text-xs text-muted-foreground">שלבים, אבני דרך, אחריות והתקדמות</div>
          </div>
          {/* <Button size="sm" variant="outline" onClick={() => toast.success("שלב חדש נוסף")}>
            + שלב
          </Button> */}
        </div>
        {ganttItems.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            טרם הוגדרו שלבים או משימות עם תאריכים לפרויקט
          </div>
        ) : (
          <GanttChart phases={ganttItems} />
        )}
      </div>

      {/* Registration Links and Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold flex items-center gap-1.5">
              <LinkIcon className="h-4 w-4 text-brand" /> קישורי הרשמה
            </div>
          </div>
          <RegistrationLinksSection projectId={id} />
        </div>

        {totalPending > 0 && (
          <div className="card-elevated p-5 border-2 border-amber-200 bg-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" /> הרשמות ממתינות לאישור
                </div>
                <div className="text-sm text-amber-700 mt-1">
                  {pendingVolunteersCount} מתנדבים · {pendingParticipantsCount} משתתפים
                </div>
              </div>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => setApprovalsOpen(true)}
              >
                סקור
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="font-semibold">נרשמים משויכים ({projectParticipants.length})</div>
            {canEditProjects && availableParticipants.length > 0 && (
              <EntityFormDialog
                triggerLabel="שייך נרשם"
                title="שיוך נרשם לפרויקט"
                description="בחרו נרשם קיים להוספה לפרויקט."
                successMessage="הנרשם שויך לפרויקט"
                fields={[
                  {
                    name: "participant",
                    label: "נרשם",
                    type: "select",
                    required: true,
                    options: availableParticipants.map(
                      (participant) => `${participant.name} (${participant.id})`,
                    ),
                  },
                ]}
                onCreate={async (values) => {
                  const participant = availableParticipants.find(
                    (item) => `${item.name} (${item.id})` === values.participant,
                  );
                  if (!participant) return { ok: false, error: "הנרשם לא נמצא" };
                  try {
                    await assignParticipant.mutateAsync({
                      projectId: project.id,
                      participantId: participant.id,
                    });
                    return { ok: true };
                  } catch (error) {
                    return {
                      ok: false,
                      error: error instanceof Error ? error.message : "שיוך הנרשם נכשל",
                    };
                  }
                }}
              />
            )}
          </div>
          {projectParticipants.length === 0 ? (
            <EmptyState text="אין נרשמים משויכים" />
          ) : (
            <ul className="space-y-2">
              {projectParticipants.map((participant) => (
                <li key={participant.id}>
                  <Link
                    to="/participants/$participantId"
                    params={{ participantId: participant.id }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted transition-colors"
                  >
                    <span className="text-sm font-medium">{participant.name}</span>
                    <span className="text-xs text-muted-foreground">{participant.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="font-semibold">מתנדבים משויכים ({projectVolunteers.length})</div>
            {canEditProjects && availableVolunteers.length > 0 && (
              <EntityFormDialog
                triggerLabel="שייך מתנדב"
                title="שיוך מתנדב לפרויקט"
                description="בחרו מתנדב פעיל להוספה לפרויקט."
                successMessage="המתנדב שויך לפרויקט"
                fields={[
                  {
                    name: "volunteer",
                    label: "מתנדב",
                    type: "select",
                    required: true,
                    options: availableVolunteers.map((v) => `${v.name} (${v.id})`),
                  },
                ]}
                onCreate={async (values) => {
                  const volunteer = availableVolunteers.find(
                    (v) => `${v.name} (${v.id})` === values.volunteer,
                  );
                  if (!volunteer) return { ok: false, error: "המתנדב לא נמצא" };
                  try {
                    await assignVolunteer.mutateAsync({
                      projectId: project.id,
                      volunteerId: volunteer.id,
                    });
                    return { ok: true };
                  } catch (err) {
                    return {
                      ok: false,
                      error: err instanceof Error ? err.message : "השמירה נכשלה",
                    };
                  }
                }}
              />
            )}
          </div>
          {projectVolunteers.length === 0 ? (
            <EmptyState text="אין מתנדבים משויכים" />
          ) : (
            <ul className="space-y-2">
              {projectVolunteers.map((v) => (
                <li key={v.id}>
                  <Link
                    to="/volunteer/$id"
                    params={{ id: v.id }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted transition-colors"
                  >
                    <span className="text-sm font-medium">{v.name}</span>
                    <span className="text-xs text-muted-foreground">{v.hours} שעות</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {canViewDonations && (
          <div className="card-elevated p-5">
            <div className="font-semibold mb-3">תרומות קשורות ({projectDonations.length})</div>
            {projectDonations.length === 0 ? (
              <EmptyState text="טרם נרשמו תרומות" />
            ) : (
              <ul className="space-y-2">
                {projectDonations.map((d) => (
                  <li key={d.id}>
                    <Link
                      to="/donation/$id"
                      params={{ id: d.id }}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted"
                    >
                      <span className="text-sm">{d.donor}</span>
                      <span className="text-sm font-semibold">
                        ₪{donationAmountForProject(d.id, d.amount).toLocaleString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <ProjectInsights project={project} canEdit={canEditProjects} />
      </div>

      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">לוח משימות</div>
          {canEditProjects && (
            <EntityFormDialog
              triggerLabel="משימה"
              title="הוספת משימה לפרויקט"
              description="משימה עם תאריכי התחלה וסיום תוצג גם בגאנט."
              successMessage="המשימה נוספה בהצלחה"
              fields={[
                { name: "title", label: "שם המשימה", required: true, colSpan: 2 },
                { name: "assignee", label: "אחראי/ת", required: true },
                {
                  name: "status",
                  label: "סטטוס",
                  type: "select",
                  required: true,
                  options: ["לביצוע", "בעבודה", "הושלם"],
                },
                { name: "startDate", label: "תאריך התחלה", type: "date", required: true },
                { name: "endDate", label: "תאריך סיום", type: "date", required: true },
              ]}
              customValidate={(values) =>
                values.startDate > values.endDate
                  ? "תאריך הסיום חייב להיות אחרי תאריך ההתחלה"
                  : null
              }
              onCreate={async (values) => {
                const columns = { לביצוע: "todo", בעבודה: "doing", הושלם: "done" } as const;
                try {
                  await createTask.mutateAsync({
                    title: values.title,
                    projectId: project.id,
                    assignee: values.assignee,
                    column: columns[values.status as keyof typeof columns],
                    startDate: values.startDate,
                    endDate: values.endDate,
                  });
                  return { ok: true };
                } catch (err) {
                  return {
                    ok: false,
                    error: err instanceof Error ? err.message : "שמירת המשימה נכשלה",
                  };
                }
              }}
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["todo", "doing", "done"] as const).map((col) => {
            const labels = { todo: "לביצוע", doing: "בעבודה", done: "הושלם" };
            const items = projectTasks.filter((t) => t.column === col);
            return (
              <div key={col} className="bg-surface-muted rounded-xl p-3 min-h-[160px]">
                <div className="flex items-center justify-between px-1 pb-3">
                  <div className="text-sm font-semibold">{labels[col]}</div>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 border border-border">
                    {items.length}
                  </span>
                </div>
                {items.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">אין משימות</div>
                ) : (
                  <div className="space-y-2">
                    {items.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white rounded-lg p-3 border border-border shadow-soft"
                      >
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

      {/* Approvals Modal */}
      <ApproveRegistrationsModal
        projectId={id}
        open={approvalsOpen}
        onOpenChange={setApprovalsOpen}
      />
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={`rounded-lg p-4 border ${tone === "danger" ? "bg-rose-50 border-rose-200" : "bg-surface-muted border-border"}`}
    >
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-xl font-bold mt-1">{value}</div>
      {sub && (
        <div
          className={`text-xs mt-0.5 ${tone === "danger" ? "text-rose-700" : "text-muted-foreground"}`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function ProjectInsights({ project, canEdit }: { project: ProjectRecord; canEdit: boolean }) {
  const [value, setValue] = useState(project.insights ?? "");
  const updateProject = useUpdateProject();

  return (
    <div className="card-elevated p-5">
      <div className="font-semibold mb-1">תובנות</div>
      <div className="text-xs text-muted-foreground mb-3">מסקנות, דגשים והמלצות להמשך הפרויקט</div>
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="הוסיפו תובנות על הפרויקט..."
        rows={6}
        disabled={!canEdit || updateProject.isPending}
      />
      {canEdit && (
        <Button
          size="sm"
          className="mt-3 bg-brand hover:bg-brand-deep"
          disabled={updateProject.isPending || value === (project.insights ?? "")}
          onClick={() => updateProject.mutate({ id: project.id, patch: { insights: value } })}
        >
          {updateProject.isPending ? "שומר..." : "שמור תובנות"}
        </Button>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center text-sm text-muted-foreground py-6">{text}</div>;
}
