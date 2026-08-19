// Business-rule engine: derives operational alerts from the current data.
// Pure rules — no AI.
import type { ProjectRecord } from "./queries/projects";
import type { VolunteerRecord } from "./queries/volunteers";
import type { DonationRecord } from "./queries/donations";
import type { SupplierRecord } from "./queries/suppliers";
import type { FamilyRecord } from "./queries/families";
import { useProjects } from "./queries/projects";
import { useVolunteers } from "./queries/volunteers";
import { useDonations } from "./queries/donations";
import { useSuppliers } from "./queries/suppliers";
import { useFamilies } from "./queries/families";
import { useAllInteractions } from "./queries/interactions";
import { useAllFollowUps } from "./queries/follow-ups";
import { useAllAssistance } from "./queries/assistance";
import { useAllAllocations } from "./queries/allocations";
import type { DonorInteraction, FollowUpTask, AssistanceRecord, DonationAllocation } from "./crm-types";
import { daysBetween, isOverdue } from "./crm-seed";

export type AlertSeverity = "גבוהה" | "בינונית" | "נמוכה";

export type Alert = {
  id: string;
  title: string;
  severity: AlertSeverity;
  module: string;
  rule: string;
  createdAt: string;
};

export type AlertEngineData = {
  projects: ProjectRecord[];
  volunteers: VolunteerRecord[];
  donations: DonationRecord[];
  suppliers: SupplierRecord[];
  interactions: DonorInteraction[];
  followUps: FollowUpTask[];
  families: FamilyRecord[];
  assistance: AssistanceRecord[];
  allocations: DonationAllocation[];
};

const REQUIRED_VOLUNTEERS_PER_PROJECT: Record<string, number> = {
  "קייטנת קיץ 2025": 30,
  "תכנית נוער שכונתית": 15,
  "ליווי משפחות עולים": 20,
  "סדנת העצמה לנשים": 10,
  "חירום ושיקום קהילתי": 25,
};

export function generateAlerts(data: AlertEngineData): Alert[] {
  const { projects, volunteers, donations, suppliers, interactions, followUps, families, assistance, allocations } =
    data;
  const out: Alert[] = [];
  let i = 1;
  const id = () => `A-${String(i++).padStart(3, "0")}`;

  // Volunteer shortage per active project
  projects
    .filter((p) => p.status === "פעיל")
    .forEach((p) => {
      const required = REQUIRED_VOLUNTEERS_PER_PROJECT[p.name] ?? 12;
      if (p.volunteers < required) {
        out.push({
          id: id(),
          title: `חוסר מתנדבים בפרויקט "${p.name}"`,
          severity: required - p.volunteers >= 10 ? "גבוהה" : "בינונית",
          module: "מתנדבים",
          rule: `נדרשים ${required} מתנדבים, משויכים ${p.volunteers}`,
          createdAt: "היום",
        });
      }
    });

  // Budget overrun / near-overrun
  projects.forEach((p) => {
    const ratio = p.spent / p.budget;
    if (ratio >= 1) {
      out.push({
        id: id(),
        title: `חריגת תקציב — ${p.name}`,
        severity: "גבוהה",
        module: "כספים",
        rule: `ביצוע ₪${p.spent.toLocaleString()} מעל תקציב ₪${p.budget.toLocaleString()}`,
        createdAt: "היום",
      });
    } else if (ratio >= 0.9) {
      out.push({
        id: id(),
        title: `התקרבות לתקרת תקציב — ${p.name}`,
        severity: "בינונית",
        module: "כספים",
        rule: `ניצול ${Math.round(ratio * 100)}% מהתקציב`,
        createdAt: "אתמול",
      });
    }
  });

  // Donations without receipts
  donations
    .filter((d) => d.receipt === "חסר" || d.receipt === "ממתין")
    .forEach((d) => {
      out.push({
        id: id(),
        title: `תרומה ללא קבלה — ${d.donor}`,
        severity: d.receipt === "חסר" ? "בינונית" : "נמוכה",
        module: "תרומות",
        rule: `סטטוס קבלה: ${d.receipt} · סכום ₪${d.amount.toLocaleString()}`,
        createdAt: d.date,
      });
    });

  // Suppliers — overdue invoices
  suppliers
    .filter((s) => s.openInvoices > 0)
    .forEach((s) => {
      out.push({
        id: id(),
        title: `חשבוניות פתוחות — ${s.name}`,
        severity: s.openInvoices >= 2 ? "בינונית" : "נמוכה",
        module: "ספקים",
        rule: `${s.openInvoices} חשבוניות פתוחות מעל 30 יום`,
        createdAt: "השבוע",
      });
    });

  // Volunteer workload overload
  volunteers
    .filter((v) => v.hours > 100)
    .forEach((v) => {
      out.push({
        id: id(),
        title: `עומס פעילות — ${v.name}`,
        severity: "נמוכה",
        module: "מתנדבים",
        rule: `${v.hours} שעות החודש (מעל הסף 100)`,
        createdAt: "השבוע",
      });
    });

  // Overdue donor follow-ups (CRM)
  interactions
    .filter((i) => i.status !== "הושלם" && isOverdue(i.followUpDate))
    .forEach((i) => {
      const late = daysBetween(i.followUpDate!);
      out.push({
        id: id(),
        title: `מעקב תורם באיחור — ${i.subject}`,
        severity: late > 14 ? "גבוהה" : "בינונית",
        module: "קשרי תורמים",
        rule: `משימת המשך "${i.followUpAction}" באיחור של ${late} ימים (אחראי: ${i.staff})`,
        createdAt: i.followUpDate!,
      });
    });

  // Overdue follow-up tasks on families and suppliers
  followUps
    .filter((f) => f.status !== "הושלם" && isOverdue(f.dueDate))
    .forEach((f) => {
      out.push({
        id: id(),
        title: `משימה באיחור — ${f.entityName}`,
        severity: daysBetween(f.dueDate) > 14 ? "גבוהה" : "בינונית",
        module: f.entityType === "family" ? "מוטבים" : "ספקים",
        rule: `${f.title} · יעד ${f.dueDate} · אחראי ${f.assignee}`,
        createdAt: f.dueDate,
      });
    });

  // Families flagged at risk without a closed care cycle
  families
    .filter((f) => f.status === "בסיכון")
    .forEach((f) => {
      out.push({
        id: id(),
        title: `משפחה בסיכון — ${f.familyName}`,
        severity: "גבוהה",
        module: "מוטבים",
        rule: `צרכים פתוחים: ${f.needs.join(", ")} · רכז/ת ${f.assignedStaff}`,
        createdAt: "היום",
      });
    });

  // Pending assistance requests awaiting committee approval
  const pendingAid = assistance.filter((a) => a.status === "ממתין");
  if (pendingAid.length > 0) {
    out.push({
      id: id(),
      title: `${pendingAid.length} בקשות סיוע ממתינות לאישור`,
      severity: "בינונית",
      module: "מוטבים",
      rule: `סך ₪${pendingAid.reduce((s, a) => s + (a.amount ?? 0), 0).toLocaleString()} ממתין להחלטת ועדת סיוע`,
      createdAt: "היום",
    });
  }

  // Unallocated donations
  allocations.length &&
    donations.forEach((d) => {
      const alloc = allocations.filter((a) => a.donationId === d.id).reduce((s, a) => s + a.amount, 0);
      if (alloc < d.amount) {
        out.push({
          id: id(),
          title: `תרומה שטרם יועדה במלואה — ${d.donor}`,
          severity: "נמוכה",
          module: "תרומות",
          rule: `יועד ₪${alloc.toLocaleString()} מתוך ₪${d.amount.toLocaleString()}`,
          createdAt: d.date,
        });
      }
    });

  return out;
}

/** Runs the alert engine against live Supabase data. */
export function useAlerts(): Alert[] {
  const { data: projects } = useProjects();
  const { data: volunteers } = useVolunteers();
  const { data: donations } = useDonations();
  const { data: suppliers } = useSuppliers();
  const { data: interactions } = useAllInteractions();
  const { data: followUps } = useAllFollowUps();
  const { data: families } = useFamilies();
  const { data: assistance } = useAllAssistance();
  const { data: allocations } = useAllAllocations();

  return generateAlerts({
    projects: projects ?? [],
    volunteers: volunteers ?? [],
    donations: donations ?? [],
    suppliers: suppliers ?? [],
    interactions: interactions ?? [],
    followUps: followUps ?? [],
    families: families ?? [],
    assistance: assistance ?? [],
    allocations: allocations ?? [],
  });
}

export const moduleRoute: Record<string, string> = {
  מתנדבים: "/volunteers",
  כספים: "/finance",
  תרומות: "/donations",
  ספקים: "/suppliers",
  פרויקטים: "/projects",
  מוטבים: "/families",
  "קשרי תורמים": "/donors",
};
