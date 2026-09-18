import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Wallet, TrendingDown, TrendingUp, LockKeyhole, Clock3, History } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard, StatusBadge } from "@/components/page-header";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { RecordEditDialog } from "@/components/record-edit-dialog";
import {
  DonationDeleteButton,
  DonationEditButton,
  IncomeDeleteButton,
  IncomeEditButton,
} from "@/components/module-edit-dialogs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIncomes, useCreateIncome } from "@/lib/queries/incomes";
import { useProjects } from "@/lib/queries/projects";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useDonations } from "@/lib/queries/donations";
import {
  useAllProjectExpenses,
  useCreateProjectExpense,
  useDeleteProjectExpense,
  useUpdateProjectExpense,
} from "@/lib/queries/project-expenses";
import {
  useBudgetRequests,
  useBudgetTransactions,
  useCreateBudgetRequest,
  useReviewBudgetRequest,
  useReleaseProjectBudget,
} from "@/lib/queries/budgets";
import { useCanEdit, useCurrentUser } from "@/lib/permissions";
import { isInCalendarMonth, useCalendarMonth } from "@/components/calendar-month-filter";

export const Route = createFileRoute("/_app/finance")({ component: FinancePage });

function FinancePage() {
  const { data: income } = useIncomes();
  const { data: donations } = useDonations();
  const { data: expenses } = useAllProjectExpenses();
  const { data: projects } = useProjects();
  const { data: suppliers } = useSuppliers();
  const { data: requests } = useBudgetRequests();
  const { data: transactions } = useBudgetTransactions();
  const currentUser = useCurrentUser();
  const canManageFinance = useCanEdit("finance");
  const createIncome = useCreateIncome();
  const createExpense = useCreateProjectExpense();
  const deleteExpense = useDeleteProjectExpense();
  const updateExpense = useUpdateProjectExpense();
  const createRequest = useCreateBudgetRequest();
  const reviewRequest = useReviewBudgetRequest();
  const releaseBudget = useReleaseProjectBudget();
  const [historyProjectId, setHistoryProjectId] = useState<string | null>(null);
  const { month } = useCalendarMonth();

  const incomeList = (income ?? []).filter((item) => isInCalendarMonth(item.date, month));
  const donationList = (donations ?? []).filter((item) => isInCalendarMonth(item.date, month));
  const expenseList = (expenses ?? []).filter((item) => isInCalendarMonth(item.date, month));
  const projectList = projects ?? [];
  const requestList = (requests ?? []).filter((item) => isInCalendarMonth(item.createdAt, month));
  const transactionList = (transactions ?? []).filter((item) => isInCalendarMonth(item.date, month));
  const otherIncome = incomeList.filter((item) => item.category !== "תרומה" && !item.donationId);
  const donationIncome = donationList.reduce((sum, item) => sum + item.amount, 0);
  const otherIncomeTotal = otherIncome.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = donationIncome + otherIncomeTotal;
  const reservedBudget = projectList.reduce((sum, project) => sum + project.budget, 0);
  const availablePool = totalIncome - reservedBudget;
  const actualExpenses = expenseList.reduce((sum, item) => sum + item.amount, 0);
  const pendingRequests = requestList.filter((request) => request.status === "ממתינה");
  const selectedTransactions = transactionList.filter(
    (item) => item.projectId === historyProjectId,
  );
  const selectedProject = projectList.find((project) => project.id === historyProjectId);
  const detailedIncome = [
    ...donationList.map((donation) => ({
      id: donation.id,
      category: "תרומה",
      source: donation.donor,
      project: donation.project || "כללי",
      method: donation.method,
      reference: donation.reference ?? "—",
      status: donation.receipt,
      date: donation.date,
      amount: donation.amount,
      kind: "donation" as const,
      record: donation,
    })),
    ...otherIncome.map((item) => ({
      id: item.id,
      category: item.category,
      source: item.source,
      project: item.project || "כללי",
      method: item.method ?? "—",
      reference: item.reference ?? "—",
      status: "התקבל",
      date: item.date,
      amount: item.amount,
      kind: "income" as const,
      record: item,
    })),
  ].sort((first, second) => second.date.localeCompare(first.date));

  const formatCurrency = (value: number) => `₪${value.toLocaleString()}`;

  return (
    <>
      <PageHeader
        title="כספים ותקציבים"
        description="ניהול הקופה, הקצאות לפרויקטים, בקשות תקציב והוצאות בפועל."
        actions={
          <div className="flex flex-wrap gap-2">
            {canManageFinance && (
              <>
                <EntityFormDialog
                  triggerLabel="הכנסה אחרת"
                  title="רישום הכנסה אחרת"
                  description="תרומות נקלטות אוטומטית מלשונית תרומות ואין להזין אותן כאן שוב."
                  successMessage="ההכנסה נוספה לקופה"
                  fields={[
                    { name: "source", label: "מקור הכנסה", required: true },
                    { name: "amount", label: "סכום (₪)", type: "number", required: true },
                    { name: "date", label: "תאריך", type: "date", required: true },
                    {
                      name: "category",
                      label: "קטגוריה",
                      type: "select",
                      required: true,
                      options: ["מענק", "אגרות נרשמים", "אחר"],
                    },
                    { name: "reference", label: "אסמכתא" },
                    { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
                  ]}
                  customValidate={(values) =>
                    Number(values.amount) > 0 ? null : "יש להזין סכום חיובי."
                  }
                  onCreate={async (values) => {
                    try {
                      await createIncome.mutateAsync({
                        source: values.source,
                        amount: Number(values.amount),
                        date: values.date,
                        category: values.category,
                        project: "כללי",
                        reference: values.reference || undefined,
                        notes: values.notes || undefined,
                      });
                      return { ok: true };
                    } catch (error) {
                      return {
                        ok: false,
                        error: error instanceof Error ? error.message : "השמירה נכשלה",
                      };
                    }
                  }}
                />
                <EntityFormDialog
                  triggerLabel="הוסף הוצאה"
                  title="הוספת הוצאה לפרויקט"
                  description="ההוצאה תופיע גם בכספים וגם בכרטיס הפרויקט ותפחית את יתרתו."
                  successMessage="ההוצאה נוספה לפרויקט"
                  fields={[
                    {
                      name: "project",
                      label: "פרויקט",
                      type: "select",
                      required: true,
                      options: projectList.map((project) => project.name),
                    },
                    { name: "amount", label: "סכום (₪)", type: "number", required: true },
                    { name: "category", label: "קטגוריה", required: true },
                    {
                      name: "supplier",
                      label: "ספק",
                      type: "select",
                      required: true,
                      options: (suppliers ?? []).map((supplier) => supplier.name),
                    },
                    { name: "date", label: "תאריך", type: "date", required: true },
                    {
                      name: "status",
                      label: "סטטוס תשלום",
                      type: "select",
                      required: true,
                      options: ["שולם", "ממתין", "חלקי"],
                    },
                    {
                      name: "description",
                      label: "תיאור",
                      type: "textarea",
                      colSpan: 2,
                      required: true,
                    },
                    { name: "reference", label: "אסמכתא", colSpan: 2, required: true },
                  ]}
                  customValidate={(values) => {
                    const project = projectList.find((item) => item.name === values.project);
                    const projectSpent = expenseList
                      .filter((item) => item.projectId === project?.id)
                      .reduce((sum, item) => sum + item.amount, 0);
                    const amount = Number(values.amount);
                    if (!(amount > 0)) return "יש להזין סכום חיובי.";
                    if (project && projectSpent + amount > project.budget)
                      return "ההוצאה חורגת מיתרת תקציב הפרויקט.";
                    return null;
                  }}
                  onCreate={async (values) => {
                    const project = projectList.find((item) => item.name === values.project);
                    const supplier = (suppliers ?? []).find(
                      (item) => item.name === values.supplier,
                    );
                    try {
                      await createExpense.mutateAsync({
                        projectId: project?.id,
                        amount: Number(values.amount),
                        category: values.category,
                        supplierId: supplier?.id,
                        date: values.date,
                        status: values.status as "שולם" | "ממתין" | "חלקי",
                        description: values.description,
                        reference: values.reference,
                        createdBy: currentUser?.name ?? currentUser?.email ?? "משתמש מערכת",
                      });
                      return { ok: true };
                    } catch (error) {
                      return {
                        ok: false,
                        error: error instanceof Error ? error.message : "שמירת ההוצאה נכשלה",
                      };
                    }
                  }}
                />
              </>
            )}
            <EntityFormDialog
              triggerLabel="בקשת תקציב נוסף"
              title="בקשת תקציב נוסף לפרויקט"
              description="הבקשה תועבר לאישור מנהלת הכספים."
              successMessage="הבקשה הוגשה לאישור"
              fields={[
                {
                  name: "project",
                  label: "פרויקט",
                  type: "select",
                  required: true,
                  options: projectList.map((project) => project.name),
                },
                { name: "amount", label: "סכום מבוקש (₪)", type: "number", required: true },
                {
                  name: "reason",
                  label: "סיבת הבקשה",
                  type: "textarea",
                  required: true,
                  colSpan: 2,
                },
              ]}
              customValidate={(values) =>
                Number(values.amount) > 0 ? null : "יש להזין סכום חיובי."
              }
              onCreate={async (values) => {
                const project = projectList.find((item) => item.name === values.project);
                try {
                  if (!project) return { ok: false, error: "יש לבחור פרויקט." };
                  await createRequest.mutateAsync({
                    projectId: project.id,
                    amount: Number(values.amount),
                    reason: values.reason,
                    requestedBy: currentUser?.name ?? currentUser?.email ?? "משתמש מערכת",
                  });
                  return { ok: true };
                } catch (error) {
                  return {
                    ok: false,
                    error: error instanceof Error ? error.message : "הגשת הבקשה נכשלה",
                  };
                }
              }}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="סה״כ הכנסות שהתקבלו"
          value={formatCurrency(totalIncome)}
          delta={`תרומות ${formatCurrency(donationIncome)} · אחרות ${formatCurrency(otherIncomeTotal)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="קופה זמינה להקצאה"
          value={formatCurrency(availablePool)}
          delta="לאחר תקציבים משוריינים"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="תקציב משוריין לפרויקטים"
          value={formatCurrency(reservedBudget)}
          delta={`${projectList.length} פרויקטים`}
          icon={<LockKeyhole className="h-5 w-5" />}
        />
        <StatCard
          label="סה״כ הוצאות בפועל"
          value={formatCurrency(actualExpenses)}
          delta="מכל הפרויקטים"
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <StatCard
          label="בקשות הממתינות לאישור"
          value={String(pendingRequests.length)}
          delta={formatCurrency(
            pendingRequests.reduce((sum, item) => sum + item.requestedAmount, 0),
          )}
          icon={<Clock3 className="h-5 w-5" />}
        />
      </div>

      <section className="card-elevated p-5 mb-6 overflow-x-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">ניהול תקציב לכל פרויקט</h2>
        </div>
        <table className="w-full min-w-[1050px] text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b text-right">
              <th className="py-3">פרויקט</th>
              <th>תקציב ראשוני</th>
              <th>תוספות שאושרו</th>
              <th>סה״כ מאושר</th>
              <th>הוחזר לקופה</th>
              <th>הוצאות בפועל</th>
              <th>יתרה</th>
              <th>% ניצול</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {projectList.map((project) => {
              const spent = expenseList
                .filter((item) => item.projectId === project.id)
                .reduce((sum, item) => sum + item.amount, 0);
              const totalApproved = project.initialBudget + project.approvedAdditions;
              const balance = project.budget - spent;
              const utilization =
                project.budget > 0 ? Math.round((spent / project.budget) * 100) : 0;
              return (
                <tr key={project.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{project.name}</td>
                  <td>{formatCurrency(project.initialBudget)}</td>
                  <td>{formatCurrency(project.approvedAdditions)}</td>
                  <td>{formatCurrency(totalApproved)}</td>
                  <td>{formatCurrency(project.releasedAmount)}</td>
                  <td>{formatCurrency(spent)}</td>
                  <td className={balance < 0 ? "text-rose-600 font-semibold" : "font-semibold"}>
                    {formatCurrency(balance)}
                  </td>
                  <td>{utilization}%</td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setHistoryProjectId(project.id)}
                      >
                        <History className="h-4 w-4 ml-1" />
                        היסטוריה
                      </Button>
                      {canManageFinance && project.status === "הסתיים" && balance > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const released = await releaseBudget.mutateAsync({
                                projectId: project.id,
                                performer: currentUser?.name ?? "מנהלת כספים",
                              });
                              toast.success(`${formatCurrency(released)} הוחזרו לקופה`);
                            } catch (error) {
                              toast.error(
                                error instanceof Error ? error.message : "שחרור היתרה נכשל",
                              );
                            }
                          }}
                        >
                          שחרור יתרה
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card-elevated p-5 mb-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">בקשות תקציב נוסף</h2>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b text-right">
              <th className="py-3">פרויקט</th>
              <th>סכום מבוקש</th>
              <th>סיבה</th>
              <th>מבקש/ת</th>
              <th>סטטוס</th>
              <th>סכום שאושר</th>
              {canManageFinance && <th>החלטה</th>}
            </tr>
          </thead>
          <tbody>
            {requestList.map((request) => (
              <tr key={request.id} className="border-b last:border-0">
                <td className="py-3 font-medium">{request.projectName}</td>
                <td>{formatCurrency(request.requestedAmount)}</td>
                <td>{request.reason}</td>
                <td>{request.requestedBy}</td>
                <td>
                  <StatusBadge value={request.status} />
                </td>
                <td>{formatCurrency(request.approvedAmount)}</td>
                {canManageFinance && (
                  <td>
                    {request.status === "ממתינה" ? (
                      <div className="flex gap-2">
                        <EntityFormDialog
                          triggerLabel="אישור"
                          title="אישור בקשת תקציב"
                          description={`ניתן לאשר את מלוא הסכום או סכום חלקי מתוך ${formatCurrency(request.requestedAmount)}.`}
                          successMessage="הבקשה עודכנה והתקציב הוקצה"
                          fields={[
                            {
                              name: "approvedAmount",
                              label: "סכום לאישור",
                              type: "number",
                              required: true,
                            },
                          ]}
                          customValidate={(values) => {
                            const amount = Number(values.approvedAmount);
                            if (amount <= 0 || amount > request.requestedAmount)
                              return "סכום האישור אינו תקין.";
                            if (amount > availablePool) return "אין מספיק כסף זמין בקופה.";
                            return null;
                          }}
                          onCreate={async (values) => {
                            try {
                              await reviewRequest.mutateAsync({
                                requestId: request.id,
                                approvedAmount: Number(values.approvedAmount),
                                reviewer: currentUser?.name ?? "מנהלת כספים",
                              });
                              return { ok: true };
                            } catch (error) {
                              return {
                                ok: false,
                                error: error instanceof Error ? error.message : "האישור נכשל",
                              };
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            reviewRequest.mutate({
                              requestId: request.id,
                              approvedAmount: 0,
                              reviewer: currentUser?.name ?? "מנהלת כספים",
                            })
                          }
                        >
                          דחייה
                        </Button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
              </tr>
            ))}
            {requestList.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  אין בקשות תקציב
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card-elevated p-5 mb-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-1">הכנסות</h2>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b text-right">
              <th className="py-3">מקור</th>
              <th>קטגוריה</th>
              <th>פרויקט / ייעוד</th>
              <th>תאריך</th>
              <th>אמצעי</th>
              <th>סטטוס קבלה</th>
              <th>סכום</th>
              {canManageFinance && <th>פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {detailedIncome.map((item) => (
              <tr key={`${item.category}-${item.id}`} className="border-b last:border-0">
                <td className="py-3 font-medium">{item.source}</td>
                <td>{item.category}</td>
                <td>{item.project}</td>
                <td>{item.date}</td>
                <td>{item.method}</td>
                <td>
                  <StatusBadge value={item.status} />
                </td>
                <td className="font-semibold text-emerald-700">{formatCurrency(item.amount)}</td>
                {canManageFinance && (
                  <td>
                    <div className="flex items-center gap-2">
                      {item.kind === "donation" ? (
                        <>
                          <DonationEditButton record={item.record} />
                          <DonationDeleteButton record={item.record} />
                        </>
                      ) : (
                        <>
                          <IncomeEditButton record={item.record} />
                          <IncomeDeleteButton record={item.record} />
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {detailedIncome.length === 0 && (
              <tr>
                <td colSpan={canManageFinance ? 8 : 7} className="py-8 text-center text-muted-foreground">
                  אין הכנסות להצגה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card-elevated p-5 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-1">הוצאות</h2>
        <table className="w-full min-w-[950px] text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b text-right">
              <th className="py-3">פרויקט</th>
              <th>קטגוריה</th>
              <th>ספק</th>
              <th>תאריך</th>
              <th>סטטוס</th>
              <th>סכום</th>
              {canManageFinance && <th>פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {expenseList.map((expense) => {
              const project = projectList.find((item) => item.id === expense.projectId);
              const supplier = (suppliers ?? []).find((item) => item.id === expense.supplierId);
              return (
                <tr key={expense.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{project?.name ?? expense.projectId}</td>
                  <td>{expense.category}</td>
                  <td>{supplier?.name ?? expense.supplier ?? "—"}</td>
                  <td>{expense.date}</td>
                  <td>
                    <StatusBadge value={expense.status} />
                  </td>
                  <td className="font-semibold">{formatCurrency(expense.amount)}</td>
                  {canManageFinance && (
                    <td>
                      <div className="flex items-center gap-2">
                        <RecordEditDialog
                          title={`עריכת הוצאה — ${expense.id}`}
                          description="עדכון פרטי ההוצאה והשיוך שלה לפרויקט."
                          fields={[
                            {
                              name: "project",
                              label: "פרויקט",
                              type: "select",
                              required: true,
                              options: projectList.map((item) => item.name),
                            },
                            { name: "amount", label: "סכום (₪)", type: "number", required: true },
                            { name: "category", label: "קטגוריה", required: true },
                            {
                              name: "supplier",
                              label: "ספק",
                              type: "select",
                              required: true,
                              options: (suppliers ?? []).map((item) => item.name),
                            },
                            { name: "date", label: "תאריך", type: "date", required: true },
                            {
                              name: "status",
                              label: "סטטוס תשלום",
                              type: "select",
                              required: true,
                              options: ["שולם", "ממתין", "חלקי"],
                            },
                            { name: "description", label: "תיאור", type: "textarea", colSpan: 2 },
                            { name: "reference", label: "אסמכתא", colSpan: 2 },
                          ]}
                          initialValues={{
                            project: project?.name ?? "",
                            amount: String(expense.amount),
                            category: expense.category,
                            supplier: supplier?.name ?? expense.supplier ?? "",
                            date: expense.date,
                            status: expense.status,
                            description: expense.description ?? "",
                            reference: expense.reference ?? "",
                          }}
                          sensitiveFields={["amount", "status"]}
                          customValidate={(values) => {
                            const selectedProject = projectList.find(
                              (item) => item.name === values.project,
                            );
                            const amount = Number(values.amount);
                            if (!(amount > 0)) return "יש להזין סכום חיובי.";
                            const otherExpenses = expenseList
                              .filter(
                                (item) =>
                                  item.projectId === selectedProject?.id && item.id !== expense.id,
                              )
                              .reduce((sum, item) => sum + item.amount, 0);
                            if (selectedProject && otherExpenses + amount > selectedProject.budget)
                              return "ההוצאה חורגת מיתרת תקציב הפרויקט.";
                            return null;
                          }}
                          onSave={async (values) => {
                            const selectedProject = projectList.find(
                              (item) => item.name === values.project,
                            );
                            const selectedSupplier = (suppliers ?? []).find(
                              (item) => item.name === values.supplier,
                            );
                            try {
                              await updateExpense.mutateAsync({
                                id: expense.id,
                                patch: {
                                  projectId: selectedProject?.id,
                                  amount: Number(values.amount),
                                  category: values.category,
                                  supplierId: selectedSupplier?.id,
                                  date: values.date,
                                  status: values.status as "שולם" | "ממתין" | "חלקי",
                                  description: values.description || undefined,
                                  reference: values.reference || undefined,
                                },
                              });
                              return { ok: true };
                            } catch (error) {
                              return {
                                ok: false,
                                error:
                                  error instanceof Error ? error.message : "שמירת ההוצאה נכשלה",
                              };
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600"
                          onClick={async () => {
                            if (!window.confirm("למחוק את ההוצאה?")) return;
                            try {
                              await deleteExpense.mutateAsync(expense);
                              toast.success("ההוצאה נמחקה");
                            } catch {
                              toast.error("מחיקת ההוצאה נכשלה");
                            }
                          }}
                        >
                          מחיקה
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <Dialog
        open={historyProjectId !== null}
        onOpenChange={(open) => !open && setHistoryProjectId(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>היסטוריית תנועות — {selectedProject?.name}</DialogTitle>
            <DialogDescription>
              הקצאות, תוספות, הוצאות והחזרי יתרה לפי סדר כרונולוגי.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="rounded-lg border p-3 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-medium">{transaction.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {transaction.date} · {transaction.performedBy}
                    {transaction.reference ? ` · ${transaction.reference}` : ""}
                  </div>
                </div>
                <div
                  className={
                    transaction.amount < 0
                      ? "font-semibold text-rose-600"
                      : "font-semibold text-emerald-700"
                  }
                >
                  {transaction.amount > 0 ? "+" : ""}
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
            {selectedTransactions.length === 0 && (
              <div className="text-center text-muted-foreground py-8">אין תנועות להצגה</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
