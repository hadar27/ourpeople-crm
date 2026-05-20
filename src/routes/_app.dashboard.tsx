import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  HeartHandshake,
  HandCoins,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader, StatCard, StatusBadge } from "@/components/page-header";
import { monthlyDonations, budgetVsActual, projectMix, alerts, donations } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const PIE_COLORS = ["#2563EB", "#1E3A8A", "#60A5FA", "#93C5FD", "#1D4ED8"];

function Dashboard() {
  return (
    <>
      <PageHeader
        title="לוח בקרה"
        description="תמונת מצב בזמן אמת על הפעילות הארגונית, התקציב והגיוס."
        actions={
          <Link
            to="/reports"
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm text-brand-foreground hover:bg-brand-deep"
          >
            דוחות מפורטים <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="תרומות החודש" value="₪238,500" delta="▲ 12.4% מהחודש שעבר" icon={<HandCoins className="h-5 w-5" />} tone="brand" />
        <StatCard label="מתנדבים פעילים" value="186" delta="▲ 8 חדשים השבוע" icon={<HeartHandshake className="h-5 w-5" />} />
        <StatCard label="פרויקטים פעילים" value="14" delta="2 בתכנון · 1 נסגר" icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="ניצול תקציב שנתי" value="62%" delta="₪936K מתוך ₪1.5M" icon={<Wallet className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground">גיוס תרומות לפי חודש</div>
              <div className="text-lg font-semibold">מגמת גיוס 6 חודשים אחרונים</div>
            </div>
            <StatusBadge value="פעיל" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyDonations}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `₪${v / 1000}K`} />
              <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2.5} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-5">
          <div className="text-sm text-muted-foreground">תמהיל פעילות</div>
          <div className="text-lg font-semibold mb-2">חלוקה לפי קהל יעד</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={projectMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {projectMix.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            {projectMix.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-muted-foreground">{p.name}</span>
                <span className="mr-auto font-medium">{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground">תקציב מול ביצוע</div>
              <div className="text-lg font-semibold">השוואת תקציב מתוכנן לפועל</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetVsActual}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="project" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `₪${v / 1000}K`} />
              <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="budget" name="תקציב" fill="#93C5FD" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" name="ביצוע" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">התראות אחרונות</div>
            <Link to="/alerts" className="text-xs text-brand hover:underline">הצג הכל</Link>
          </div>
          <ul className="space-y-3">
            {alerts.slice(0, 4).map((a) => (
              <li key={a.id} className="flex gap-3 p-3 rounded-lg bg-surface-muted border border-border">
                <div className="p-1.5 h-fit rounded-md bg-white border border-border">
                  <AlertTriangle className={`h-4 w-4 ${a.severity === "גבוהה" ? "text-rose-600" : a.severity === "בינונית" ? "text-amber-600" : "text-brand"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{a.module}</span>·<span>{a.createdAt}</span>
                  </div>
                </div>
                <StatusBadge value={a.severity} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card-elevated p-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-semibold flex items-center gap-2"><CalendarClock className="h-4 w-4" /> פעילות אחרונה</div>
            <div className="text-xs text-muted-foreground">תרומות אחרונות שנקלטו במערכת</div>
          </div>
          <Link to="/donations" className="text-xs text-brand hover:underline">לכל התרומות</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="text-right">
              <th className="py-2">תורם</th>
              <th className="py-2">פרויקט</th>
              <th className="py-2">סכום</th>
              <th className="py-2">קבלה</th>
              <th className="py-2">תאריך</th>
            </tr>
          </thead>
          <tbody>
            {donations.slice(0, 5).map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="py-3 font-medium">{d.donor}</td>
                <td className="py-3 text-muted-foreground">{d.project}</td>
                <td className="py-3 font-semibold">₪{d.amount.toLocaleString()}</td>
                <td className="py-3"><StatusBadge value={d.receipt} /></td>
                <td className="py-3 text-muted-foreground">{d.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
