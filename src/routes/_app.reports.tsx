import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/page-header";
import { Activity, Target, Heart, Users } from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
import { monthlyDonations, budgetVsActual } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

const radar = [
  { metric: "גיוס", value: 88 },
  { metric: "מתנדבים", value: 76 },
  { metric: "תקציב", value: 62 },
  { metric: "השפעה", value: 91 },
  { metric: "שביעות רצון", value: 84 },
  { metric: "שימור תורמים", value: 71 },
];

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

function ReportsPage() {
  return (
    <>
      <PageHeader title="KPI ודוחות BI" description="לוח אנליטי אינטראקטיבי עם KPI, מגמות ומפות חום." />

      <div className="card-elevated p-4 mb-6 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium">סינון:</span>
        {["כל הפרויקטים", "מאי 2025", "כל הפעילויות", "כל התרומות"].map((t) => (
          <span key={t} className="text-xs bg-secondary text-brand-deep px-3 py-1.5 rounded-full font-medium">
            {t}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="מדד השפעה (Impact)" value="91/100" icon={<Heart className="h-5 w-5" />} tone="brand" />
        <StatCard label="יעד גיוס שנתי" value="84%" delta="₪1.42M / ₪1.7M" icon={<Target className="h-5 w-5" />} />
        <StatCard label="פעילות חודשית" value="3,240h" delta="שעות מתנדבים" icon={<Activity className="h-5 w-5" />} />
        <StatCard label="נתרמו ע״י" value="412 תורמים" delta="198 חוזרים" icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card-elevated p-5">
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

        <div className="card-elevated p-5">
          <div className="text-sm text-muted-foreground">פרופיל KPI</div>
          <div className="text-lg font-semibold mb-2">תמונת מצב רב-מדדית</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radar}>
              <PolarGrid stroke="#CBD5E1" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 12 }} />
              <PolarRadiusAxis stroke="#94A3B8" />
              <Radar dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </>
  );
}
