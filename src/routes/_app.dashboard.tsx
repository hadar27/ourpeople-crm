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
  UserPlus,
  FolderPlus,
  GiftIcon,
  Receipt,
  Zap,
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
} from "recharts";
import { PageHeader, StatCard, StatusBadge } from "@/components/page-header";
import { useAlerts, moduleRoute } from "@/lib/business-rules";
import { useDonations } from "@/lib/queries/donations";
import { useProjects } from "@/lib/queries/projects";
import { useVolunteers } from "@/lib/queries/volunteers";
import { monthlyDonationTotals } from "@/lib/dashboard-metrics";
import { toast } from "sonner";
import { useCanEdit } from "@/lib/permissions";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const quickActions = [
  { label: "הוסף תורם", icon: UserPlus, to: "/donors" as const, msg: "טופס תורם חדש נפתח" },
  { label: "צור פרויקט", icon: FolderPlus, to: "/projects" as const, msg: "טופס פרויקט חדש נפתח" },
  {
    label: "תרומה חדשה",
    icon: GiftIcon,
    to: "/donations" as const,
    msg: "טופס תרומה נפתח",
    module: "donations" as const,
  },
  {
    label: "שייך מתנדבים",
    icon: HeartHandshake,
    to: "/volunteers" as const,
    msg: "מסך שיוך מתנדבים",
  },
  {
    label: "צור הוצאה",
    icon: Receipt,
    to: "/finance" as const,
    msg: "טופס הוצאה נפתח",
    module: "finance" as const,
  },
];

function Dashboard() {
  const alerts = useAlerts();
  const { data: donations } = useDonations();
  const { data: projects } = useProjects();
  const { data: volunteers } = useVolunteers();
  const canViewDonations = useCanEdit("donations");
  const canViewFinance = useCanEdit("finance");
  const visibleQuickActions = quickActions.filter(
    (qa) =>
      (qa.module !== "donations" || canViewDonations) &&
      (qa.module !== "finance" || canViewFinance),
  );

  const donationList = donations ?? [];
  const projectList = projects ?? [];
  const volunteerList = volunteers ?? [];

  const now = new Date();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthKey = monthKey(now);
  const lastMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const thisMonthTotal = donationList
    .filter((d) => d.date.slice(0, 7) === thisMonthKey)
    .reduce((s, d) => s + d.amount, 0);
  const lastMonthTotal = donationList
    .filter((d) => d.date.slice(0, 7) === lastMonthKey)
    .reduce((s, d) => s + d.amount, 0);
  const donationDelta =
    lastMonthTotal > 0
      ? `${thisMonthTotal >= lastMonthTotal ? "▲" : "▼"} ${Math.round(
          (Math.abs(thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100,
        )}% מהחודש שעבר`
      : "אין נתונים להשוואה לחודש שעבר";

  const activeVolunteers = volunteerList.filter((v) => v.status === "פעיל").length;
  const onBreakVolunteers = volunteerList.filter((v) => v.status === "בהפסקה").length;

  const activeProjects = projectList.filter((p) => p.status === "פעיל").length;
  const planningProjects = projectList.filter((p) => p.status === "בתכנון").length;
  const closedProjects = projectList.filter((p) => p.status === "הסתיים").length;

  const totalBudget = projectList.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projectList.reduce((s, p) => s + p.spent, 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const shortMoney = (v: number) =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${Math.round(v / 1000)}K`;

  const monthlyDonations = monthlyDonationTotals(donationList);
  const budgetVsActual = projectList.map((p) => ({
    project: p.name,
    budget: p.budget,
    actual: p.spent,
  }));
  const recentDonations = donationList.slice(0, 5);

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
        {canViewDonations && (
          <StatCard
            label="תרומות החודש"
            value={`₪${thisMonthTotal.toLocaleString()}`}
            delta={donationDelta}
            icon={<HandCoins className="h-5 w-5" />}
            tone="brand"
          />
        )}
        <StatCard
          label="מתנדבים פעילים"
          value={String(activeVolunteers)}
          delta={`${onBreakVolunteers} בהפסקה`}
          icon={<HeartHandshake className="h-5 w-5" />}
        />
        <StatCard
          label="פרויקטים פעילים"
          value={String(activeProjects)}
          delta={`${planningProjects} בתכנון · ${closedProjects} הסתיימו`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="ניצול תקציב שנתי"
          value={`${budgetPct}%`}
          delta={`₪${shortMoney(totalSpent)} מתוך ₪${shortMoney(totalBudget)}`}
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="card-elevated p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand" /> פעולות מהירות
          </div>
          <span className="text-xs text-muted-foreground">קיצורי דרך לפעולות יומיומיות</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {visibleQuickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <Link
                key={qa.label}
                to={qa.to}
                onClick={() => toast.info(qa.msg)}
                className="group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border bg-surface-muted hover:bg-brand hover:text-white hover:border-brand transition-all"
              >
                <Icon className="h-6 w-6 text-brand group-hover:text-white transition-colors" />
                <span className="text-xs font-medium text-center">{qa.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {canViewDonations && (
        <div className="card-elevated p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground">גיוס תרומות לפי חודש</div>
              <div className="text-lg font-semibold">מגמת גיוס — חודשים אחרונים</div>
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
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

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
            <Link to="/alerts" className="text-xs text-brand hover:underline">
              הצג הכל
            </Link>
          </div>
          <ul className="space-y-3">
            {alerts.slice(0, 4).map((a) => (
              <li
                key={a.id}
                className="flex gap-3 p-3 rounded-lg bg-surface-muted border border-border"
              >
                <div className="p-1.5 h-fit rounded-md bg-white border border-border">
                  <AlertTriangle
                    className={`h-4 w-4 ${a.severity === "גבוהה" ? "text-rose-600" : a.severity === "בינונית" ? "text-amber-600" : "text-brand"}`}
                  />
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

      {canViewDonations && (
        <div className="card-elevated p-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-lg font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4" /> פעילות אחרונה
              </div>
              <div className="text-xs text-muted-foreground">תרומות אחרונות שנקלטו במערכת</div>
            </div>
            <Link to="/donations" className="text-xs text-brand hover:underline">
              לכל התרומות
            </Link>
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
              {recentDonations.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-border hover:bg-surface-muted/60 cursor-pointer"
                >
                  <td className="py-3 font-medium">
                    <Link to="/donation/$id" params={{ id: d.id }} className="hover:text-brand">
                      {d.donor}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground">{d.project}</td>
                  <td className="py-3 font-semibold">₪{d.amount.toLocaleString()}</td>
                  <td className="py-3">
                    <StatusBadge value={d.receipt} />
                  </td>
                  <td className="py-3 text-muted-foreground">{d.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
