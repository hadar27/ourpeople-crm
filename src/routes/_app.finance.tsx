import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, StatusBadge } from "@/components/page-header";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { Wallet, TrendingDown, TrendingUp, Receipt } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useIncomes, useCreateIncome, GENERAL_PROJECT as GENERAL_PROJECT_INCOME } from "@/lib/queries/incomes";
import { useExpenses, useCreateExpense, GENERAL_PROJECT as GENERAL_PROJECT_EXPENSE } from "@/lib/queries/expenses";
import { useProjects } from "@/lib/queries/projects";
import { useSuppliers } from "@/lib/queries/suppliers";
import { useDonations } from "@/lib/queries/donations";
import { monthlyDonationTotals } from "@/lib/dashboard-metrics";
import { ExpenseEditButton, IncomeEditButton } from "@/components/module-edit-dialogs";

export const Route = createFileRoute("/_app/finance")({
  component: FinancePage,
});


function FinancePage() {
  const { data: income } = useIncomes();
  const { data: expenses } = useExpenses();
  const { data: projects } = useProjects();
  const { data: suppliers } = useSuppliers();
  const { data: donations } = useDonations();
  const createIncome = useCreateIncome();
  const createExpense = useCreateExpense();
  const projectOptions = [GENERAL_PROJECT_INCOME, ...(projects ?? []).map((p) => p.name)];
  const supplierOptions = (suppliers ?? []).map((s) => s.name);
  const monthlyDonations = monthlyDonationTotals(donations ?? []);
  const budgetVsActual = (projects ?? []).map((p) => ({ project: p.name, budget: p.budget, actual: p.spent }));
  return (
    <>
      <PageHeader title="כספים — ERP" description="לוח בקרה פיננסי כולל הכנסות, הוצאות וניצול תקציב מול תכנון."
        actions={
          <div className="flex items-center gap-2">
            <EntityFormDialog
              triggerLabel="הוסף הכנסה"
              title="הוספת הכנסה חדשה"
              description="רישום הכנסה למערכת ה-ERP."
              successMessage="הכנסה חדשה נקלטה בהצלחה"
              fields={[
                { name: "source", label: "מקור הכנסה", required: true, colSpan: 2 },
                { name: "amount", label: "סכום (₪)", type: "number", required: true },
                { name: "date", label: "תאריך", type: "date", required: true },
                { name: "category", label: "קטגוריה", type: "select", required: true, options: ["תרומה", "מענק", "אגרות נרשמים", "אחר"] },
                { name: "project", label: "פרויקט", type: "select", options: projectOptions },
                { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
              ]}
              onCreate={async (v) => {
                const project = (projects ?? []).find((p) => p.name === v.project);
                try {
                  await createIncome.mutateAsync({
                    source: v.source,
                    amount: Number(v.amount) || 0,
                    date: v.date,
                    category: v.category,
                    projectId: project?.id,
                    project: v.project || GENERAL_PROJECT_INCOME,
                    notes: v.notes || undefined,
                  });
                  return { ok: true };
                } catch (err) {
                  return { ok: false, error: err instanceof Error ? err.message : "השמירה נכשלה" };
                }
              }}
            />
            <EntityFormDialog
              triggerLabel="הוסף הוצאה"
              title="הוספת הוצאה חדשה"
              description="רישום הוצאה לניצול תקציב הפרויקט."
              successMessage="הוצאה חדשה נקלטה בהצלחה"
              fields={[
                { name: "category", label: "קטגוריה", type: "select", required: true, options: ["שכר ותפעול", "הסעות", "קייטרינג", "ציוד", "פרסום ושיווק", "אחר"] },
                { name: "amount", label: "סכום (₪)", type: "number", required: true },
                { name: "project", label: "פרויקט", type: "select", required: true, options: [GENERAL_PROJECT_EXPENSE, ...(projects ?? []).map((p) => p.name)] },
                { name: "supplier", label: "ספק", type: "select", options: supplierOptions },
                { name: "date", label: "תאריך", type: "date", required: true },
                { name: "status", label: "סטטוס", type: "select", options: ["שולם", "ממתין", "חלקי"] },
                { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
              ]}
              onCreate={async (v) => {
                const project = (projects ?? []).find((p) => p.name === v.project);
                const supplier = (suppliers ?? []).find((s) => s.name === v.supplier);
                try {
                  await createExpense.mutateAsync({
                    category: v.category,
                    amount: Number(v.amount) || 0,
                    date: v.date,
                    supplierId: supplier?.id,
                    supplier: v.supplier || "",
                    projectId: project?.id,
                    project: v.project || GENERAL_PROJECT_EXPENSE,
                    status: v.status || "ממתין",
                    notes: v.notes || undefined,
                  });
                  return { ok: true };
                } catch (err) {
                  return { ok: false, error: err instanceof Error ? err.message : "השמירה נכשלה" };
                }
              }}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="הכנסות השנה" value="₪1.42M" delta="▲ 9.2% מהתחזית" icon={<TrendingUp className="h-5 w-5" />} tone="brand" />
        <StatCard label="הוצאות השנה" value="₪936K" delta="62% מהתקציב" icon={<TrendingDown className="h-5 w-5" />} />
        <StatCard label="תזרים נקי" value="₪484K" delta="יתרה חיובית" icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="חשבוניות פתוחות" value="11" delta="₪82,300 לתשלום" icon={<Receipt className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card-elevated p-5">
          <div className="text-sm text-muted-foreground">הכנסות מצטברות</div>
          <div className="text-lg font-semibold mb-2">קו מגמה — 6 חודשים</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyDonations}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `₪${v / 1000}K`} />
              <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="amount" stroke="#1E3A8A" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card-elevated p-5">
          <div className="text-sm text-muted-foreground">תקציב מול ביצוע</div>
          <div className="text-lg font-semibold mb-2">לפי פרויקט</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={budgetVsActual} layout="vertical">
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `₪${v / 1000}K`} />
              <YAxis type="category" dataKey="project" stroke="#94A3B8" fontSize={11} width={90} />
              <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="budget" name="תקציב" fill="#93C5FD" radius={[0, 6, 6, 0]} />
              <Bar dataKey="actual" name="ביצוע" fill="#2563EB" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-elevated p-5">
          <div className="text-lg font-semibold mb-3">הכנסות אחרונות</div>
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-right"><th className="py-2">מקור</th><th className="py-2">סכום</th><th className="py-2">תאריך</th><th className="py-2">פעולות</th></tr>
            </thead>
            <tbody>
              {(income ?? []).map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="py-3">{i.source}</td>
                  <td className="py-3 font-semibold">₪{i.amount.toLocaleString()}</td>
                  <td className="py-3 text-muted-foreground">{i.date}</td>
                  <td className="py-3"><IncomeEditButton record={i} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-elevated p-5">
          <div className="text-lg font-semibold mb-3">הוצאות אחרונות</div>
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-right"><th className="py-2">קטגוריה</th><th className="py-2">פרויקט</th><th className="py-2">סכום</th><th className="py-2">סטטוס</th><th className="py-2">פעולות</th></tr>
            </thead>
            <tbody>
              {(expenses ?? []).map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="py-3">{e.category}</td>
                  <td className="py-3 text-muted-foreground">{e.project}</td>
                  <td className="py-3 font-semibold">₪{e.amount.toLocaleString()}</td>
                  <td className="py-3"><StatusBadge value={e.status} /></td>
                  <td className="py-3"><ExpenseEditButton record={e} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
