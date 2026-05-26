import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Target, Heart, Users, Search, Star, Clock, CalendarClock, FileSpreadsheet, FileText, Filter, FolderOpen } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { monthlyDonations, budgetVsActual, reportsCatalog, type ReportCategory, type ReportDef } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

// Heat map data — months x activity types
const months = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני"];
const activityTypes = ["נוער", "נשים", "משפחות", "חירום", "עולים"];
const heat: number[][] = [
  [40, 22, 35, 12, 18],
  [55, 28, 41, 8, 22],
  [62, 31, 48, 14, 26],
  [58, 35, 52, 16, 28],
  [71, 42, 60, 22, 34],
  [66, 38, 55, 18, 30],
];

function heatColor(v: number) {
  const max = 80;
  const t = Math.min(v / max, 1);
  const alpha = 0.12 + t * 0.78;
  return `rgba(37, 99, 235, ${alpha.toFixed(2)})`;
}

const ALL_CATEGORIES: (ReportCategory | "הכל" | "מועדפים")[] = [
  "הכל",
  "מועדפים",
  "קליטה ועלייה",
  "סיוע למשפחות",
  "מתנדבים",
  "תורמים",
  "כספים",
  "פרויקטים",
  "תפעול",
];

function ReportsPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<(typeof ALL_CATEGORIES)[number]>("הכל");

  const filtered = useMemo(() => {
    return reportsCatalog.filter((r) => {
      if (activeCat === "מועדפים" && !r.favorite) return false;
      if (activeCat !== "הכל" && activeCat !== "מועדפים" && r.category !== activeCat) return false;
      if (search && !(`${r.name} ${r.description}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [search, activeCat]);

  const recent = useMemo(
    () =>
      [...reportsCatalog]
        .filter((r) => r.lastRun)
        .sort((a, b) => (b.lastRun ?? "").localeCompare(a.lastRun ?? ""))
        .slice(0, 5),
    [],
  );

  return (
    <>
      <PageHeader
        title="KPI ודוחות BI"
        description="לוח אנליטי אינטראקטיבי ומרכז דוחות מבצעי עבור הארגון."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="מדד השפעה (Impact)" value="91/100" icon={<Heart className="h-5 w-5" />} tone="brand" />
        <StatCard label="יעד גיוס שנתי" value="84%" delta="₪1.42M / ₪1.7M" icon={<Target className="h-5 w-5" />} />
        <StatCard label="פעילות חודשית" value="3,240h" delta="שעות מתנדבים" icon={<Activity className="h-5 w-5" />} />
        <StatCard label="נתרמו ע״י" value="412 תורמים" delta="198 חוזרים" icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card-elevated p-5">
          <div className="text-lg font-semibold mb-2">מגמת גיוס</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyDonations}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `₪${v / 1000}K`} />
              <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="amount" stroke="#1E3A8A" fill="url(#g1)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card-elevated p-5">
          <div className="text-lg font-semibold mb-2">תקציב מול ביצוע</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={budgetVsActual}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis dataKey="project" stroke="#94A3B8" fontSize={10} />
              <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `₪${v / 1000}K`} />
              <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="budget" name="תקציב" fill="#93C5FD" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" name="ביצוע" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-elevated p-5 mb-6">
        <div className="text-sm text-muted-foreground">מפת חום — פעילות לפי חודש וקהל</div>
        <div className="text-lg font-semibold mb-4">עצימות פעילות</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th></th>
                {activityTypes.map((a) => <th key={a} className="px-2 py-1 text-center font-medium text-muted-foreground">{a}</th>)}
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={m}>
                  <td className="pr-2 text-muted-foreground font-medium">{m}</td>
                  {heat[i].map((v, j) => (
                    <td key={j} className="p-1">
                      <div
                        className="rounded-md h-10 flex items-center justify-center font-semibold text-brand-deep"
                        style={{ backgroundColor: heatColor(v) }}
                      >
                        {v}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports Center */}
      <div className="card-elevated p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <div className="text-xl font-bold flex items-center gap-2"><FolderOpen className="h-5 w-5 text-brand" /> מרכז דוחות</div>
            <div className="text-sm text-muted-foreground">חיפוש, סינון, הפקה ותזמון של דוחות תפעוליים ופיננסיים</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש דוח..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-8 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info("פתיחת מסך מסננים מתקדמים")}>
              <Filter className="h-4 w-4 ml-1" /> מסננים מתקדמים
            </Button>
            <Button size="sm" className="bg-brand hover:bg-brand-deep" onClick={() => toast.success("נפתח אשף תזמון דוח")}>
              <CalendarClock className="h-4 w-4 ml-1" /> תזמן דוח
            </Button>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {ALL_CATEGORIES.map((c) => {
            const active = activeCat === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                  active
                    ? "bg-brand text-white border-brand"
                    : "bg-secondary text-brand-deep border-transparent hover:bg-brand-light"
                }`}
              >
                {c === "מועדפים" ? "★ מועדפים" : c}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Reports list */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              מציג {filtered.length} מתוך {reportsCatalog.length} דוחות
            </div>
            <div className="space-y-3">
              {filtered.map((r) => <ReportCard key={r.id} report={r} />)}
              {filtered.length === 0 && (
                <div className="text-center py-10 text-sm text-muted-foreground border border-dashed rounded-xl">
                  לא נמצאו דוחות התואמים את הסינון
                </div>
              )}
            </div>
          </div>

          {/* Recent */}
          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-surface-muted p-4">
              <div className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand" /> הופקו לאחרונה</div>
              <ul className="space-y-2">
                {recent.map((r) => (
                  <li key={r.id} className="text-xs">
                    <button
                      onClick={() => toast.success(`הדוח "${r.name}" מופק מחדש`)}
                      className="w-full text-right p-2 rounded-md bg-white hover:bg-brand-light/40 border border-border transition-colors"
                    >
                      <div className="font-medium text-foreground truncate">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{r.lastRun}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-white p-4">
              <div className="text-sm font-semibold mb-2 flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-brand" /> דוחות מתוזמנים</div>
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                <li>• 7 דוחות שבועיים</li>
                <li>• 5 דוחות חודשיים</li>
                <li>• 2 דוחות רבעוניים</li>
              </ul>
              <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => toast.info("פתיחת ניהול תזמונים")}>
                נהל תזמונים
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function ReportCard({ report }: { report: ReportDef }) {
  return (
    <div className="rounded-xl border border-border p-4 hover:shadow-card hover:border-brand/30 transition-all bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-brand-light text-brand-deep px-2 py-0.5 rounded-md font-medium">{report.category}</span>
            {report.scheduled && (
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" /> {report.scheduled}
              </span>
            )}
            {report.favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
          </div>
          <div className="font-semibold mt-1.5">{report.name}</div>
          <div className="text-xs text-muted-foreground mt-1">{report.description}</div>
          {report.lastRun && (
            <div className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> הופק לאחרונה: {report.lastRun}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          {report.formats.includes("Excel") && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => toast.success(`מייצא "${report.name}" ל-Excel`)}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 ml-1" /> Excel
            </Button>
          )}
          {report.formats.includes("PDF") && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => toast.success(`מייצא "${report.name}" ל-PDF`)}
            >
              <FileText className="h-3.5 w-3.5 ml-1" /> PDF
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs bg-brand hover:bg-brand-deep"
            onClick={() => toast.success(`הדוח "${report.name}" נשלח להפקה`)}
          >
            הפק עכשיו
          </Button>
        </div>
      </div>
    </div>
  );
}
