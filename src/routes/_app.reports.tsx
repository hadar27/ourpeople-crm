import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/page-header";
import {
  Activity,
  Users,
  HandCoins,
  UserRoundSearch,
  HeartHandshake,
  FolderKanban,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-table";
import { useDonations } from "@/lib/queries/donations";
import { useDonors } from "@/lib/queries/donors";
import { useProjects, type ProjectRecord } from "@/lib/queries/projects";
import { useVolunteers, useAllProjectVolunteerAssignments } from "@/lib/queries/volunteers";
import { useParticipants, type ParticipantRecord } from "@/lib/queries/participants";
import { useExpenses } from "@/lib/queries/expenses";
import { useFamilies } from "@/lib/queries/families";
import { useAllAssistance } from "@/lib/queries/assistance";
import { useAllAllocations } from "@/lib/queries/allocations";
import { monthlyDonationTotals } from "@/lib/dashboard-metrics";
import { useCanEdit } from "@/lib/permissions";

const NEW_IMMIGRANTS_YEARS_BACK = 15;
const BUDGET_CAP_RATIO = 0.9;

type ReportRow = Record<string, unknown>;
type ReportKey =
  "supplier-liabilities" | "volunteer-gaps" | "family-assistance" | "project-summary";

const newImmigrantColumns: Column<ParticipantRecord>[] = [
  { key: "name", header: "שם מלא", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "idNumber", header: "ת.ז." },
  { key: "phone", header: "טלפון" },
  { key: "project", header: "פרויקט" },
  { key: "city", header: "עיר" },
  { key: "immigrationYear", header: "שנת עלייה" },
];

type ProjectWithRatio = ProjectRecord & { ratioPercent: number };

const budgetCapColumns: Column<ProjectWithRatio>[] = [
  { key: "name", header: "פרויקט", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "manager", header: "מנהל/ת" },
  { key: "budget", header: "תקציב", render: (r) => `₪${r.budget.toLocaleString()}` },
  { key: "spent", header: "ביצוע", render: (r) => `₪${r.spent.toLocaleString()}` },
  { key: "ratioPercent", header: "אחוז ביצוע", render: (r) => `${r.ratioPercent}%` },
];

const supplierLiabilityColumns: Column<ReportRow>[] = [
  {
    key: "supplier",
    header: "ספק",
    render: (r) => <span className="font-medium">{String(r.supplier)}</span>,
  },
  {
    key: "balance",
    header: "יתרה לתשלום",
    render: (r) => `₪${Number(r.balance).toLocaleString()}`,
  },
  { key: "date", header: "תאריך" },
  { key: "category", header: "קטגוריה" },
  { key: "reference", header: "אסמכתא" },
];

const volunteerGapColumns: Column<ReportRow>[] = [
  {
    key: "project",
    header: "פרויקט",
    render: (r) => <span className="font-medium">{String(r.project)}</span>,
  },
  { key: "required", header: "כמות דרושה" },
  { key: "assigned", header: "כמות משויכת" },
  {
    key: "gap",
    header: "פער",
    render: (r) => (
      <span
        className={
          Number(r.gap) > 0 ? "font-semibold text-rose-600" : "font-semibold text-emerald-700"
        }
      >
        {Number(r.gap)}
      </span>
    ),
  },
  { key: "status", header: "סטטוס פרויקט" },
];

const familyAssistanceColumns: Column<ReportRow>[] = [
  {
    key: "family",
    header: "משפחה",
    render: (r) => <span className="font-medium">{String(r.family)}</span>,
  },
  { key: "contact", header: "איש קשר" },
  { key: "phone", header: "טלפון" },
  { key: "assistanceType", header: "סוג הסיוע" },
  { key: "description", header: "פירוט" },
  {
    key: "amount",
    header: "סכום",
    render: (r) => (Number(r.amount) ? `₪${Number(r.amount).toLocaleString()}` : "—"),
  },
  { key: "date", header: "תאריך" },
  { key: "status", header: "סטטוס" },
];

const projectSummaryColumns: Column<ReportRow>[] = [
  {
    key: "project",
    header: "פרויקט",
    render: (r) => <span className="font-medium">{String(r.project)}</span>,
  },
  { key: "budget", header: "תקציב", render: (r) => `₪${Number(r.budget).toLocaleString()}` },
  { key: "spent", header: "ביצוע", render: (r) => `₪${Number(r.spent).toLocaleString()}` },
  { key: "remaining", header: "יתרה", render: (r) => `₪${Number(r.remaining).toLocaleString()}` },
  { key: "participantCount", header: "מספר משתתפים" },
  {
    key: "participantDetails",
    header: "פרטי משתתפים",
    className: "min-w-[260px] whitespace-normal",
  },
  { key: "volunteerCount", header: "מספר מתנדבים" },
  { key: "volunteerDetails", header: "פרטי מתנדבים", className: "min-w-[240px] whitespace-normal" },
  {
    key: "donationTotal",
    header: "סך תרומות",
    render: (r) => `₪${Number(r.donationTotal).toLocaleString()}`,
  },
  { key: "donationDetails", header: "פרטי תרומות", className: "min-w-[240px] whitespace-normal" },
  { key: "insights", header: "תובנות", className: "min-w-[260px] whitespace-normal" },
];

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: donations } = useDonations();
  const { data: donors } = useDonors();
  const { data: projects } = useProjects();
  const { data: volunteers } = useVolunteers();
  const { data: volunteerAssignments } = useAllProjectVolunteerAssignments();
  const { data: participants } = useParticipants();
  const { data: expenses } = useExpenses();
  const { data: families } = useFamilies();
  const { data: assistance } = useAllAssistance();
  const { data: allocations } = useAllAllocations();
  const canViewDonations = useCanEdit("donations");
  const [newImmigrantsOpen, setNewImmigrantsOpen] = useState(false);
  const [budgetCapOpen, setBudgetCapOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportKey | null>(null);

  const donationList = donations ?? [];
  const donorList = donors ?? [];
  const projectList = projects ?? [];
  const volunteerList = volunteers ?? [];
  const participantList = participants ?? [];
  const expenseList = expenses ?? [];
  const familyList = families ?? [];
  const assistanceList = assistance ?? [];
  const allocationList = allocations ?? [];
  const assignmentList = volunteerAssignments ?? [];

  const currentYear = new Date().getFullYear();
  const newImmigrantsList = participantList.filter(
    (p) =>
      p.isNewImmigrant &&
      p.immigrationYear !== undefined &&
      currentYear - p.immigrationYear <= NEW_IMMIGRANTS_YEARS_BACK,
  );

  const totalVolunteerHours = volunteerList.reduce((s, v) => s + v.hours, 0);
  const donationCountByDonor = new Map<string, number>();
  donationList.forEach((d) => {
    if (!d.donorId) return;
    donationCountByDonor.set(d.donorId, (donationCountByDonor.get(d.donorId) ?? 0) + 1);
  });
  const repeatDonorCount = [...donationCountByDonor.values()].filter((count) => count > 1).length;

  const budgetCapList: ProjectWithRatio[] = projectList
    .filter((p) => p.budget > 0 && p.spent / p.budget >= BUDGET_CAP_RATIO)
    .map((p) => ({ ...p, ratioPercent: Math.round((p.spent / p.budget) * 100) }));

  const monthlyDonations = monthlyDonationTotals(donationList);
  const budgetVsActual = projectList.map((p) => ({
    project: p.name,
    budget: p.budget,
    actual: p.spent,
  }));

  const supplierLiabilityRows: ReportRow[] = expenseList
    .filter((expense) => expense.supplier && expense.status !== "שולם")
    .map((expense) => ({
      supplier: expense.supplier,
      balance: expense.amount,
      date: expense.date,
      category: expense.category,
      reference: expense.reference ?? "—",
    }));

  const assignedVolunteerIdsByProject = new Map<string, Set<string>>();
  const addVolunteerAssignment = (projectId: string, volunteerId: string) => {
    const ids = assignedVolunteerIdsByProject.get(projectId) ?? new Set<string>();
    ids.add(volunteerId);
    assignedVolunteerIdsByProject.set(projectId, ids);
  };
  assignmentList.forEach((assignment) =>
    addVolunteerAssignment(assignment.projectId, assignment.volunteerId),
  );
  volunteerList.forEach((volunteer) => {
    if (volunteer.projectId) addVolunteerAssignment(volunteer.projectId, volunteer.id);
  });

  const volunteerGapRows: ReportRow[] = projectList.map((project) => {
    const required = project.requiredVolunteers ?? 0;
    const assigned = assignedVolunteerIdsByProject.get(project.id)?.size ?? 0;
    return {
      project: project.name,
      required,
      assigned,
      gap: Math.max(required - assigned, 0),
      status: project.status,
    };
  });

  const familyById = new Map(familyList.map((family) => [family.id, family]));
  const familyAssistanceRows: ReportRow[] = assistanceList
    .filter((item) => item.status !== "נדחה")
    .map((item) => {
      const family = familyById.get(item.familyId);
      return {
        family: family?.familyName ?? item.familyId,
        contact: family?.mainContact ?? "—",
        phone: family?.phone ?? "—",
        assistanceType: item.type,
        description: item.description,
        amount: item.amount ?? 0,
        date: item.date,
        status: item.status,
      };
    });

  const allocationsByProject = new Map<string, { donationId: string; amount: number }[]>();
  allocationList.forEach((allocation) => {
    const projectAllocations = allocationsByProject.get(allocation.projectId) ?? [];
    projectAllocations.push({ donationId: allocation.donationId, amount: allocation.amount });
    allocationsByProject.set(allocation.projectId, projectAllocations);
  });
  const donationsWithAllocations = new Set(
    allocationList.map((allocation) => allocation.donationId),
  );
  const donationById = new Map(donationList.map((donation) => [donation.id, donation]));

  const projectSummaryRows: ReportRow[] = projectList.map((project) => {
    const projectParticipants = participantList.filter(
      (participant) => participant.projectId === project.id,
    );
    const volunteerIds = assignedVolunteerIdsByProject.get(project.id) ?? new Set<string>();
    const projectVolunteers = volunteerList.filter((volunteer) => volunteerIds.has(volunteer.id));
    const projectDonationParts = [
      ...(allocationsByProject.get(project.id) ?? []).map((allocation) => ({
        donation: donationById.get(allocation.donationId),
        amount: allocation.amount,
      })),
      ...donationList
        .filter(
          (donation) =>
            donation.projectId === project.id && !donationsWithAllocations.has(donation.id),
        )
        .map((donation) => ({ donation, amount: donation.amount })),
    ];
    return {
      project: project.name,
      budget: project.budget,
      spent: project.spent,
      remaining: project.budget - project.spent,
      participantCount: projectParticipants.length,
      participantDetails:
        projectParticipants
          .map(
            (participant) => `${participant.name} | ${participant.idNumber} | ${participant.phone}`,
          )
          .join("; ") || "—",
      volunteerCount: projectVolunteers.length,
      volunteerDetails:
        projectVolunteers
          .map((volunteer) => `${volunteer.name}${volunteer.phone ? ` | ${volunteer.phone}` : ""}`)
          .join("; ") || "—",
      donationTotal: canViewDonations
        ? projectDonationParts.reduce((sum, part) => sum + part.amount, 0)
        : 0,
      donationDetails: canViewDonations
        ? projectDonationParts
            .map((part) => `${part.donation?.donor ?? "תרומה"}: ₪${part.amount.toLocaleString()}`)
            .join("; ") || "—"
        : "אין הרשאה לצפייה בתרומות",
      insights: project.insights || "—",
    };
  });

  const reportConfig: Record<
    ReportKey,
    {
      title: string;
      description: string;
      rows: ReportRow[];
      columns: Column<ReportRow>[];
      filename: string;
    }
  > = {
    "supplier-liabilities": {
      title: "דוח התחייבויות מול ספקים",
      description: "הוצאות שטרם שולמו, לפי ספק, יתרה ותאריך.",
      rows: supplierLiabilityRows,
      columns: supplierLiabilityColumns,
      filename: "supplier-liabilities",
    },
    "volunteer-gaps": {
      title: "דוח פערי מתנדבים בפרויקטים",
      description: "כמות המתנדבים הדרושה, המשויכת והפער בכל פרויקט.",
      rows: volunteerGapRows,
      columns: volunteerGapColumns,
      filename: "project-volunteer-gaps",
    },
    "family-assistance": {
      title: "דוח משפחות המקבלות סיוע",
      description: "רשימת המשפחות ורשומות הסיוע שאינן דחויות.",
      rows: familyAssistanceRows,
      columns: familyAssistanceColumns,
      filename: "family-assistance",
    },
    "project-summary": {
      title: "דוח פרויקט מורחב",
      description: "תקציב, משתתפים, מתנדבים, תרומות ותובנות לפי פרויקט.",
      rows: projectSummaryRows,
      columns: projectSummaryColumns,
      filename: "project-summary",
    },
  };
  const selectedReport = activeReport ? reportConfig[activeReport] : null;

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

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">דוחות מפורטים</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReportCard
            title="התחייבויות מול ספקים"
            description="ספק, יתרה לתשלום ותאריך"
            count={supplierLiabilityRows.length}
            icon={<HandCoins className="h-5 w-5" />}
            onClick={() => setActiveReport("supplier-liabilities")}
          />
          <ReportCard
            title="פערי מתנדבים בפרויקטים"
            description="כמות דרושה, משויכת והפער"
            count={volunteerGapRows.length}
            icon={<UserRoundSearch className="h-5 w-5" />}
            onClick={() => setActiveReport("volunteer-gaps")}
          />
          <ReportCard
            title="משפחות המקבלות סיוע"
            description="פרטי המשפחה וסוג הסיוע"
            count={familyAssistanceRows.length}
            icon={<HeartHandshake className="h-5 w-5" />}
            onClick={() => setActiveReport("family-assistance")}
          />
          <ReportCard
            title="דוח פרויקט מורחב"
            description="תקציב, אנשים, תרומות ותובנות"
            count={projectSummaryRows.length}
            icon={<FolderKanban className="h-5 w-5" />}
            onClick={() => setActiveReport("project-summary")}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setNewImmigrantsOpen(true)}
          className="text-sm text-brand underline hover:text-brand-deep text-right"
        >
          עולים חדשים שעלו ב-{NEW_IMMIGRANTS_YEARS_BACK} השנים האחרונות ({newImmigrantsList.length})
        </button>
        <button
          type="button"
          onClick={() => setBudgetCapOpen(true)}
          className="text-sm text-brand underline hover:text-brand-deep text-right"
        >
          פרויקטים המתקרבים לתקרת התקציב ({Math.round(BUDGET_CAP_RATIO * 100)}%+) (
          {budgetCapList.length})
        </button>
      </div>

      <Dialog open={activeReport !== null} onOpenChange={(open) => !open && setActiveReport(null)}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedReport.title}</DialogTitle>
                <DialogDescription>{selectedReport.description}</DialogDescription>
              </DialogHeader>
              <DataTable
                rows={selectedReport.rows}
                columns={selectedReport.columns}
                searchKeys={selectedReport.columns.map((column) => column.key)}
                exportFilename={selectedReport.filename}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={newImmigrantsOpen} onOpenChange={setNewImmigrantsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>עולים חדשים - {NEW_IMMIGRANTS_YEARS_BACK} השנים האחרונות</DialogTitle>
            <DialogDescription>
              משתתפים המסומנים כעולים חדשים, שעלו ב-{NEW_IMMIGRANTS_YEARS_BACK} השנים האחרונות או
              פחות.
            </DialogDescription>
          </DialogHeader>
          <DataTable
            rows={newImmigrantsList}
            columns={newImmigrantColumns}
            searchKeys={["name", "idNumber", "phone", "city"]}
            exportFilename="olim-chadashim"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={budgetCapOpen} onOpenChange={setBudgetCapOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>פרויקטים המתקרבים לתקרת התקציב</DialogTitle>
            <DialogDescription>
              פרויקטים שביצוע התקציב שלהם הגיע ל-{Math.round(BUDGET_CAP_RATIO * 100)}% מהתקציב או
              יותר.
            </DialogDescription>
          </DialogHeader>
          <DataTable
            rows={budgetCapList}
            columns={budgetCapColumns}
            searchKeys={["name", "manager"]}
            exportFilename="tikrat-tazkiv"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportCard({
  title,
  description,
  count,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  count: number;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-elevated p-5 text-right transition-colors hover:border-brand/40 hover:bg-surface-muted"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground mt-1">{description}</div>
        </div>
        <div className="rounded-lg bg-secondary p-2 text-brand">{icon}</div>
      </div>
      <div className="text-xs text-brand mt-4">פתיחת הדוח · {count} רשומות</div>
    </button>
  );
}
