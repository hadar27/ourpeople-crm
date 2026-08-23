import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/page-header";
import { Activity, Users } from "lucide-react";
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
import { useDonations } from "@/lib/queries/donations";
import { useDonors } from "@/lib/queries/donors";
import { useProjects } from "@/lib/queries/projects";
import { useVolunteers } from "@/lib/queries/volunteers";
import { monthlyDonationTotals } from "@/lib/dashboard-metrics";
import { useCanEdit } from "@/lib/permissions";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: donations } = useDonations();
  const { data: donors } = useDonors();
  const { data: projects } = useProjects();
  const { data: volunteers } = useVolunteers();
  const canViewDonations = useCanEdit("donations");

  const donationList = donations ?? [];
  const donorList = donors ?? [];
  const projectList = projects ?? [];
  const volunteerList = volunteers ?? [];

  const totalVolunteerHours = volunteerList.reduce((s, v) => s + v.hours, 0);
  const donationCountByDonor = new Map<string, number>();
  donationList.forEach((d) => {
    if (!d.donorId) return;
    donationCountByDonor.set(d.donorId, (donationCountByDonor.get(d.donorId) ?? 0) + 1);
  });
  const repeatDonorCount = [...donationCountByDonor.values()].filter((count) => count > 1).length;

  const monthlyDonations = monthlyDonationTotals(donationList);
  const budgetVsActual = projectList.map((p) => ({
    project: p.name,
    budget: p.budget,
    actual: p.spent,
  }));

  return (
    <>
      <PageHeader title="KPI ודוחות BI" description="לוח אנליטי אינטראקטיבי עבור הארגון." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="שעות התנדבות (סה״כ)"
          value={`${totalVolunteerHours.toLocaleString()}h`}
          delta="סה״כ שעות מדווחות"
          icon={<Activity className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="תורמים"
          value={`${donorList.length} תורמים`}
          delta={canViewDonations ? `${repeatDonorCount} חוזרים` : undefined}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canViewDonations && (
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
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#1E3A8A"
                  fill="url(#g1)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
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
