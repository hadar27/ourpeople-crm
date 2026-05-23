// Business-rule engine: derives operational alerts from the current data.
// Pure rules — no AI.
import { projects, volunteers, donations, suppliers, type Alert } from "./mock-data";

const REQUIRED_VOLUNTEERS_PER_PROJECT: Record<string, number> = {
  "קייטנת קיץ 2025": 30,
  "תכנית נוער שכונתית": 15,
  "ליווי משפחות עולים": 20,
  "סדנת העצמה לנשים": 10,
  "חירום ושיקום קהילתי": 25,
};

export function generateAlerts(): Alert[] {
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

  return out;
}

export const moduleRoute: Record<string, string> = {
  מתנדבים: "/volunteers",
  כספים: "/finance",
  תרומות: "/donations",
  ספקים: "/suppliers",
  פרויקטים: "/projects",
};
