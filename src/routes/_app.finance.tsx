import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, StatusBadge } from "@/components/page-header";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { budgetVsActual, monthlyDonations } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/finance")({
  component: FinancePage,
});

const expenses = [
  { id: "EX-1", category: "שכר ותפעול", amount: 84200, project: "כללי", date: "2025-05-10", status: "שולם" },
  { id: "EX-2", category: "הסעות", amount: 12300, project: "קייטנת קיץ 2025", date: "2025-05-12", status: "שולם" },
  { id: "EX-3", category: "קייטרינג", amount: 18900, project: "סדנת העצמה לנשים", date: "2025-05-14", status: "ממתין" },
  { id: "EX-4", category: "ערכות חירום", amount: 32400, project: "חירום ושיקום", date: "2025-05-15", status: "שולם" },
  { id: "EX-5", category: "פרסום ושיווק", amount: 6700, project: "כללי", date: "2025-05-16", status: "ממתין" },
];

const income = [
  { id: "IN-1", source: "תרומה — קרן הירש", amount: 50000, date: "2025-05-12" },
  { id: "IN-2", source: "תרומה — חברת טכנולגיה", amount: 80000, date: "2025-04-28" },
  { id: "IN-3", source: 'תרומה — קרן "אור"', amount: 120000, date: "2025-05-10" },
  { id: "IN-4", source: "אגרות נרשמים", amount: 24800, date: "2025-05-18" },
];

function FinancePage() {
  return (
    <>
      <PageHeader title="כספים — ERP" description="לוח בקרה פיננסי כולל הכנסות, הוצאות וניצול תקציב מול תכנון."
        actions={
          <div className="flex items-center gap-2">
            <Button className="bg-brand hover:bg-brand-deep gap-1" onClick={() => toast.success("הכנסה חדשה נקלטה בהצלחה")}>
              <Plus className="h-4 w-4" /> הוסף הכנסה
            </Button>
            <Button className="bg-brand hover:bg-brand-deep gap-1" onClick={() => toast.success("הוצאה חדשה נקלטה בהצלחה")}>
              <Plus className="h-4 w-4" /> הוסף הוצאה
            </Button>
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
              <tr className="text-right"><th className="py-2">מקור</th><th className="py-2">סכום</th><th className="py-2">תאריך</th></tr>
            </thead>
            <tbody>
              {income.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="py-3">{i.source}</td>
                  <td className="py-3 font-semibold">₪{i.amount.toLocaleString()}</td>
                  <td className="py-3 text-muted-foreground">{i.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-elevated p-5">
          <div className="text-lg font-semibold mb-3">הוצאות אחרונות</div>
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-right"><th className="py-2">קטגוריה</th><th className="py-2">פרויקט</th><th className="py-2">סכום</th><th className="py-2">סטטוס</th></tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="py-3">{e.category}</td>
                  <td className="py-3 text-muted-foreground">{e.project}</td>
                  <td className="py-3 font-semibold">₪{e.amount.toLocaleString()}</td>
                  <td className="py-3"><StatusBadge value={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
