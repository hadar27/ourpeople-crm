import type {
  ActivityEntry,
  AssistanceRecord,
  BeneficiaryFamily,
  DonationAllocation,
  DonorInteraction,
  EntityDocument,
  FamilyMember,
  FollowUpTask,
  PurchaseOrder,
  SupplierContract,
  SupplierInvoice,
  SupplierPayment,
} from "./crm-types";

/** Fixed "today" for the demo dataset — keeps derived alerts deterministic (SSR-safe). */
export const TODAY = "2025-05-25";

export function daysBetween(from: string, to: string = TODAY): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.round((b - a) / 86400000);
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return daysBetween(dueDate) > 0;
}

// ============ Donor interactions (CRM) ============
export const seedInteractions: DonorInteraction[] = [
  {
    id: "IN-001", donorId: "D-501", type: "פגישה", date: "2025-05-04", time: "10:30", staff: "מאיה גרין",
    subject: "פגישת חידוש מענק שנתי",
    summary: "נפגשנו במשרדי הקרן. הוצגה תכנית קייטנת קיץ 2025 ותקציב מפורט. הקרן הביעה עניין להגדיל את התמיכה ב-15%.",
    outcome: "הקרן מבקשת דוח השפעה מרבעון קודם לפני אישור סופי.",
    followUpAction: "שליחת דוח השפעה Q1 + טיוטת הסכם מענק",
    followUpDate: "2025-05-15", status: "פתוח", createdAt: "2025-05-04",
  },
  {
    id: "IN-002", donorId: "D-501", type: "שיחת טלפון", date: "2025-04-12", time: "14:00", staff: "מאיה גרין",
    subject: "אישור העברה בנקאית",
    summary: "שיחה קצרה לאימות פרטי חשבון להעברת המענק הרבעוני.",
    outcome: "ההעברה בוצעה, קבלה הופקה.",
    status: "הושלם", createdAt: "2025-04-12",
  },
  {
    id: "IN-003", donorId: "D-502", type: 'דוא"ל', date: "2025-05-11", time: "09:15", staff: "דוד לוי",
    subject: "שיתוף פעולה בהתנדבות עובדים",
    summary: "החברה מציעה יום התנדבות עובדים בתכנית הנוער השכונתית, כ-40 עובדים.",
    outcome: "נדרש תיאום לוגיסטי מול רכז המתנדבים.",
    followUpAction: "תיאום מועד יום התנדבות עם אורן שטרן",
    followUpDate: "2025-05-20", status: "ממתין", createdAt: "2025-05-11",
  },
  {
    id: "IN-004", donorId: "D-503", type: "שיחת טלפון", date: "2025-05-02", time: "16:45", staff: "מאיה גרין",
    subject: "תודה על תרומה חודשית",
    summary: "שיחת תודה אישית על התרומה החודשית לליווי משפחות.",
    outcome: "המשפחה מעוניינת לקבל עדכון תמונות מהשטח.",
    followUpAction: "שליחת ניוזלטר חודשי עם תמונות",
    followUpDate: "2025-06-01", status: "פתוח", createdAt: "2025-05-02",
  },
  {
    id: "IN-005", donorId: "D-505", type: "פגישה", date: "2025-05-10", time: "11:00", staff: "שרה כהן",
    subject: "סיור בסדנת העצמה לנשים",
    summary: "נציגות הקרן ביקרו בסדנה, שוחחו עם משתתפות ועם המנחה נועה ברק.",
    outcome: "הקרן אישרה מענק המשך של ₪120,000.",
    status: "הושלם", createdAt: "2025-05-10",
  },
  {
    id: "IN-006", donorId: "D-506", type: "WhatsApp", date: "2024-11-04", time: "19:20", staff: "מאיה גרין",
    subject: "בדיקת שביעות רצון",
    summary: "פנייה לבדיקת שביעות רצון לאחר תרומה חד-פעמית.",
    outcome: "לא התקבלה תשובה. התורמת סומנה כלא פעילה.",
    followUpAction: "ניסיון חידוש קשר לקראת קמפיין סוף שנה",
    followUpDate: "2025-05-01", status: "פתוח", createdAt: "2024-11-04",
  },
  {
    id: "IN-007", donorId: "D-504", type: "שיחת טלפון", date: "2025-05-15", time: "13:10", staff: "דוד לוי",
    subject: "תרומה ייעודית לחירום",
    summary: "התורם הודיע על שיק בסך ₪5,000 לפרויקט חירום ושיקום.",
    outcome: "השיק התקבל, ממתין להפקת קבלה.",
    followUpAction: "הפקת קבלה ושליחתה בדואר",
    followUpDate: "2025-05-22", status: "ממתין", createdAt: "2025-05-15",
  },
];

// ============ Supplier ERP ============
export const seedContracts: SupplierContract[] = [
  { id: "C-1001", supplierId: "S-301", title: "הסעות קייטנת קיץ 2025", projectId: "PR-01", value: 90000, startDate: "2025-04-01", endDate: "2025-09-01", status: "בתוקף" },
  { id: "C-1002", supplierId: "S-301", title: "הסעות ליווי משפחות", projectId: "PR-03", value: 42000, startDate: "2025-01-15", endDate: "2025-12-31", status: "בתוקף" },
  { id: "C-1003", supplierId: "S-301", title: "הסעות מועדונית", projectId: "PR-06", value: 28000, startDate: "2024-09-01", endDate: "2025-04-15", status: "הסתיים" },
  { id: "C-1004", supplierId: "S-302", title: "קייטרינג יומי קייטנה", projectId: "PR-01", value: 120000, startDate: "2025-05-01", endDate: "2025-08-31", status: "בתוקף" },
  { id: "C-1005", supplierId: "S-302", title: "כיבוד סדנאות", projectId: "PR-04", value: 14000, startDate: "2025-03-01", endDate: "2025-07-31", status: "בתוקף" },
  { id: "C-1006", supplierId: "S-303", title: "אספקת ציוד משרדי ופעילות", value: 60000, startDate: "2025-01-01", endDate: "2025-12-31", status: "בתוקף" },
  { id: "C-1007", supplierId: "S-304", title: "מערך הדרכות ותוכן", projectId: "PR-02", value: 85000, startDate: "2025-02-01", endDate: "2025-11-30", status: "בתוקף" },
  { id: "C-1008", supplierId: "S-304", title: "ליווי מקצועי למשפחות", projectId: "PR-03", value: 56000, startDate: "2025-03-01", endDate: "2025-10-31", status: "בתוקף" },
  { id: "C-1009", supplierId: "S-305", title: "דפוס חומרי שיווק", value: 18000, startDate: "2025-01-01", endDate: "2025-06-30", status: "בטיוטה" },
];

export const seedPOs: PurchaseOrder[] = [
  { id: "PO-2001", supplierId: "S-301", projectId: "PR-01", description: "הסעות מאי — 12 נסיעות", amount: 25000, date: "2025-05-01", status: "מאושרת" },
  { id: "PO-2002", supplierId: "S-301", projectId: "PR-03", description: "הסעות ליווי משפחות מאי", amount: 18000, date: "2025-05-08", status: "ממתין" },
  { id: "PO-2003", supplierId: "S-302", projectId: "PR-01", description: "ארוחות צהריים — שבוע 1-2", amount: 42000, date: "2025-05-05", status: "מאושרת" },
  { id: "PO-2004", supplierId: "S-303", projectId: "PR-01", description: "ציוד פעילות וכלי יצירה", amount: 12000, date: "2025-04-28", status: "מאושרת" },
  { id: "PO-2005", supplierId: "S-303", projectId: "PR-02", description: "ציוד למועדון נוער", amount: 9500, date: "2025-04-18", status: "מאושרת" },
  { id: "PO-2006", supplierId: "S-304", projectId: "PR-02", description: "מחזור הדרכות אפריל-מאי", amount: 32000, date: "2025-04-25", status: "מאושרת" },
  { id: "PO-2007", supplierId: "S-305", description: "הדפסת 5,000 עלונים", amount: 8500, date: "2025-05-14", status: "ממתין" },
];

export const seedSupplierInvoices: SupplierInvoice[] = [
  { id: "INV-3001", supplierId: "S-301", projectId: "PR-01", poId: "PO-2001", amount: 25000, issueDate: "2025-05-04", dueDate: "2025-06-03", status: "שולם" },
  { id: "INV-3002", supplierId: "S-301", projectId: "PR-03", poId: "PO-2002", amount: 18000, issueDate: "2025-04-12", dueDate: "2025-05-12", status: "באיחור" },
  { id: "INV-3003", supplierId: "S-302", projectId: "PR-01", poId: "PO-2003", amount: 42000, issueDate: "2025-05-10", dueDate: "2025-06-09", status: "שולם" },
  { id: "INV-3004", supplierId: "S-302", projectId: "PR-04", amount: 6500, issueDate: "2025-05-08", dueDate: "2025-06-07", status: "שולם" },
  { id: "INV-3005", supplierId: "S-303", projectId: "PR-01", poId: "PO-2004", amount: 12000, issueDate: "2025-04-02", dueDate: "2025-05-02", status: "באיחור" },
  { id: "INV-3006", supplierId: "S-303", projectId: "PR-02", poId: "PO-2005", amount: 9500, issueDate: "2025-05-12", dueDate: "2025-06-11", status: "ממתין" },
  { id: "INV-3007", supplierId: "S-304", projectId: "PR-02", poId: "PO-2006", amount: 32000, issueDate: "2025-05-02", dueDate: "2025-06-01", status: "שולם" },
  { id: "INV-3008", supplierId: "S-304", projectId: "PR-03", amount: 28000, issueDate: "2025-05-05", dueDate: "2025-06-04", status: "שולם" },
  { id: "INV-3009", supplierId: "S-305", amount: 8500, issueDate: "2025-03-18", dueDate: "2025-04-17", status: "חלקי" },
];

export const seedSupplierPayments: SupplierPayment[] = [
  { id: "PM-4001", supplierId: "S-301", invoiceId: "INV-3001", amount: 25000, date: "2025-05-20", method: "העברה בנקאית" },
  { id: "PM-4002", supplierId: "S-302", invoiceId: "INV-3003", amount: 42000, date: "2025-05-18", method: "העברה בנקאית" },
  { id: "PM-4003", supplierId: "S-302", invoiceId: "INV-3004", amount: 6500, date: "2025-05-16", method: "אשראי" },
  { id: "PM-4004", supplierId: "S-304", invoiceId: "INV-3007", amount: 32000, date: "2025-05-14", method: "העברה בנקאית" },
  { id: "PM-4005", supplierId: "S-304", invoiceId: "INV-3008", amount: 28000, date: "2025-05-19", method: "העברה בנקאית" },
  { id: "PM-4006", supplierId: "S-305", invoiceId: "INV-3009", amount: 4000, date: "2025-04-20", method: "שיק" },
];

export const seedDocuments: EntityDocument[] = [
  { id: "DOC-01", entityType: "supplier", entityId: "S-301", name: "הסכם הסעות 2025.pdf", kind: "חוזה", uploadedAt: "2025-04-01", uploadedBy: "רונית פרץ" },
  { id: "DOC-02", entityType: "supplier", entityId: "S-301", name: "אישור ניכוי מס במקור.pdf", kind: "אישור מס", uploadedAt: "2025-01-08", uploadedBy: "רונית פרץ" },
  { id: "DOC-03", entityType: "supplier", entityId: "S-301", name: "ביטוח צד ג׳.pdf", kind: "ביטוח", uploadedAt: "2025-02-11", uploadedBy: "שרה כהן" },
  { id: "DOC-04", entityType: "supplier", entityId: "S-302", name: "רישיון עסק — קייטרינג.pdf", kind: "רישיון", uploadedAt: "2025-01-20", uploadedBy: "רונית פרץ" },
  { id: "DOC-05", entityType: "supplier", entityId: "S-302", name: "תעודת כשרות.pdf", kind: "אישור", uploadedAt: "2025-01-20", uploadedBy: "רונית פרץ" },
  { id: "DOC-06", entityType: "supplier", entityId: "S-303", name: "הצעת מחיר ציוד Q2.pdf", kind: "הצעת מחיר", uploadedAt: "2025-04-01", uploadedBy: "דוד לוי" },
  { id: "DOC-07", entityType: "supplier", entityId: "S-304", name: "הסכם מסגרת תוכן.pdf", kind: "חוזה", uploadedAt: "2025-02-01", uploadedBy: "שרה כהן" },
  { id: "DOC-08", entityType: "supplier", entityId: "S-305", name: "אישור ניהול ספרים.pdf", kind: "אישור מס", uploadedAt: "2024-12-30", uploadedBy: "רונית פרץ" },
  { id: "DOC-09", entityType: "family", entityId: "F-101", name: "תעודת עולה.pdf", kind: "מסמך זהות", uploadedAt: "2025-02-14", uploadedBy: "פאדי נסר" },
  { id: "DOC-10", entityType: "family", entityId: "F-101", name: "אישור הכנסות.pdf", kind: "כלכלי", uploadedAt: "2025-03-02", uploadedBy: "פאדי נסר" },
  { id: "DOC-11", entityType: "family", entityId: "F-102", name: "חוזה שכירות.pdf", kind: "דיור", uploadedAt: "2025-01-25", uploadedBy: "ליאת אזולאי" },
];

export const seedActivity: ActivityEntry[] = [
  { id: "AC-01", entityType: "supplier", entityId: "S-301", date: "2025-05-20", actor: "רונית פרץ", action: "תשלום בוצע", detail: "חשבונית INV-3001 · ₪25,000" },
  { id: "AC-02", entityType: "supplier", entityId: "S-301", date: "2025-05-12", actor: "מערכת", action: "חשבונית עברה לסטטוס באיחור", detail: "INV-3002" },
  { id: "AC-03", entityType: "supplier", entityId: "S-301", date: "2025-05-01", actor: "דוד לוי", action: "הזמנת רכש נוצרה", detail: "PO-2001" },
  { id: "AC-04", entityType: "supplier", entityId: "S-301", date: "2025-04-01", actor: "שרה כהן", action: "חוזה נחתם", detail: "C-1001 · ₪90,000" },
  { id: "AC-05", entityType: "supplier", entityId: "S-302", date: "2025-05-18", actor: "רונית פרץ", action: "תשלום בוצע", detail: "INV-3003 · ₪42,000" },
  { id: "AC-06", entityType: "supplier", entityId: "S-303", date: "2025-05-02", actor: "מערכת", action: "חשבונית עברה לסטטוס באיחור", detail: "INV-3005" },
  { id: "AC-07", entityType: "supplier", entityId: "S-305", date: "2025-04-20", actor: "רונית פרץ", action: "תשלום חלקי", detail: "INV-3009 · ₪4,000 מתוך ₪8,500" },
  { id: "AC-08", entityType: "supplier", entityId: "S-305", date: "2025-05-06", actor: "שרה כהן", action: "הספק הושעה", detail: "חריגה מלוחות זמנים" },
];

// ============ Beneficiary families ============
export const seedFamilies: BeneficiaryFamily[] = [
  { id: "F-101", familyName: "משפחת אברמוב", mainContact: "דנה אברמוב", phone: "0521122334", email: "abramov@example.com", city: "אשדוד", countryOfOrigin: "אוקראינה", immigrationDate: "2018-06-14", membersCount: 5, needs: ["עברית", "תעסוקה", "חינוך"], status: "בטיפול פעיל", assignedStaff: "פאדי נסר", projectId: "PR-03", notes: "שני ילדים בגיל בית ספר, האם מחפשת עבודה בתחום ההנדסה." },
  { id: "F-102", familyName: "משפחת מרים", mainContact: "סוזן מרים", phone: "0533344556", city: "נתניה", countryOfOrigin: "אתיופיה", immigrationDate: "2022-03-02", membersCount: 6, needs: ["דיור", "מזון", "עברית"], status: "בסיכון", assignedStaff: "ליאת אזולאי", projectId: "PR-03", notes: "קושי בתשלומי שכירות, נדרש ליווי צמוד." },
  { id: "F-103", familyName: "משפחת בקר", mainContact: "אלינור בקר", phone: "0508877665", email: "becker@example.com", city: "חיפה", countryOfOrigin: "רוסיה", immigrationDate: "2023-09-21", membersCount: 3, needs: ["עברית", "חינוך"], status: "מלווה", assignedStaff: "נועה ברק", projectId: "PR-01" },
  { id: "F-104", familyName: "משפחת חליל", mainContact: "מוחמד חליל", phone: "0544455667", city: "לוד", countryOfOrigin: "ישראל", immigrationDate: "1990-01-01", membersCount: 7, needs: ["מזון", "ריהוט", "בריאות"], status: "בטיפול פעיל", assignedStaff: "דניאל מזרחי", projectId: "PR-05" },
  { id: "F-105", familyName: "משפחת לוי-אשד", mainContact: "נטלי לוי", phone: "0541239876", city: "ירושלים", countryOfOrigin: "צרפת", immigrationDate: "2016-08-30", membersCount: 4, needs: ["תעסוקה", "משפטי"], status: "ממתינה לאישור", assignedStaff: "פאדי נסר" },
  { id: "F-106", familyName: "משפחת עבדאללה", mainContact: "אחמד עבדאללה", phone: "0527788991", city: "רמלה", countryOfOrigin: "ישראל", immigrationDate: "1985-01-01", membersCount: 5, needs: ["חינוך", "תעסוקה"], status: "מלווה", assignedStaff: "ליאת אזולאי", projectId: "PR-02" },
  { id: "F-107", familyName: "משפחת פרידמן", mainContact: "רחל פרידמן", phone: "0507788990", city: "בת ים", countryOfOrigin: "ארגנטינה", immigrationDate: "2011-11-11", membersCount: 2, needs: ["בריאות", "מזון"], status: "סגורה", assignedStaff: "נועה ברק" },
];

export const seedFamilyMembers: FamilyMember[] = [
  { id: "FM-01", familyId: "F-101", name: "דנה אברמוב", relation: "ראש משפחה", birthYear: 1984, status: "מבוגר", notes: "מהנדסת אזרחית, לומדת עברית ברמה ג׳" },
  { id: "FM-02", familyId: "F-101", name: "איגור אברמוב", relation: "בן/בת זוג", birthYear: 1981, status: "מבוגר", notes: "עובד בתחום הריתוך" },
  { id: "FM-03", familyId: "F-101", name: "מריה אברמוב", relation: "ילד/ה", birthYear: 2011, status: "קטין" },
  { id: "FM-04", familyId: "F-101", name: "ניקיטה אברמוב", relation: "ילד/ה", birthYear: 2014, status: "קטין" },
  { id: "FM-05", familyId: "F-101", name: "גלינה אברמוב", relation: "הורה", birthYear: 1955, status: "גמלאי" },
  { id: "FM-06", familyId: "F-102", name: "סוזן מרים", relation: "ראש משפחה", birthYear: 1979, status: "מבוגר" },
  { id: "FM-07", familyId: "F-102", name: "טסאיי מרים", relation: "בן/בת זוג", birthYear: 1976, status: "מבוגר" },
  { id: "FM-08", familyId: "F-102", name: "אביבה מרים", relation: "ילד/ה", birthYear: 2008, status: "קטין" },
  { id: "FM-09", familyId: "F-102", name: "יונתן מרים", relation: "ילד/ה", birthYear: 2012, status: "קטין" },
  { id: "FM-10", familyId: "F-103", name: "אלינור בקר", relation: "ראש משפחה", birthYear: 1990, status: "מבוגר" },
  { id: "FM-11", familyId: "F-103", name: "לב בקר", relation: "ילד/ה", birthYear: 2015, status: "קטין" },
  { id: "FM-12", familyId: "F-103", name: "סופיה בקר", relation: "ילד/ה", birthYear: 2019, status: "קטין" },
  { id: "FM-13", familyId: "F-104", name: "מוחמד חליל", relation: "ראש משפחה", birthYear: 1972, status: "מבוגר" },
  { id: "FM-14", familyId: "F-104", name: "פאטמה חליל", relation: "בן/בת זוג", birthYear: 1975, status: "מבוגר" },
  { id: "FM-15", familyId: "F-104", name: "עלי חליל", relation: "ילד/ה", birthYear: 2005, status: "סטודנט" },
  { id: "FM-16", familyId: "F-105", name: "נטלי לוי", relation: "ראש משפחה", birthYear: 1988, status: "מבוגר" },
  { id: "FM-17", familyId: "F-106", name: "אחמד עבדאללה", relation: "ראש משפחה", birthYear: 1983, status: "מבוגר" },
  { id: "FM-18", familyId: "F-107", name: "רחל פרידמן", relation: "ראש משפחה", birthYear: 1958, status: "גמלאי" },
];

export const seedAssistance: AssistanceRecord[] = [
  { id: "AS-01", familyId: "F-101", type: "עברית", description: "שיבוץ לאולפן ערב + חונכות אישית", date: "2025-02-20", projectId: "PR-03", staff: "פאדי נסר", status: "סופק" },
  { id: "AS-02", familyId: "F-101", type: "תעסוקה", description: "ליווי תעסוקתי — כתיבת קו״ח והכנה לראיונות", date: "2025-03-15", projectId: "PR-03", staff: "נועה ברק", status: "סופק" },
  { id: "AS-03", familyId: "F-101", type: "חינוך", description: "מלגת חוגים לשני ילדים", amount: 2400, date: "2025-04-10", projectId: "PR-03", staff: "פאדי נסר", status: "אושר" },
  { id: "AS-04", familyId: "F-102", type: "דיור", description: "סיוע בתשלום שכירות — 3 חודשים", amount: 9000, date: "2025-03-01", projectId: "PR-03", staff: "ליאת אזולאי", status: "סופק" },
  { id: "AS-05", familyId: "F-102", type: "מזון", description: "סל מזון חודשי", amount: 650, date: "2025-05-01", projectId: "PR-03", staff: "ליאת אזולאי", status: "סופק" },
  { id: "AS-06", familyId: "F-102", type: "דיור", description: "בקשה להארכת סיוע בשכירות", amount: 9000, date: "2025-05-18", projectId: "PR-03", staff: "ליאת אזולאי", status: "ממתין" },
  { id: "AS-07", familyId: "F-103", type: "חינוך", description: "קייטנת קיץ לשני ילדים", amount: 1700, date: "2025-05-15", projectId: "PR-01", staff: "נועה ברק", status: "אושר" },
  { id: "AS-08", familyId: "F-104", type: "מזון", description: "שוברי מזון חירום", amount: 1200, date: "2025-05-10", projectId: "PR-05", staff: "דניאל מזרחי", status: "סופק" },
  { id: "AS-09", familyId: "F-104", type: "ריהוט", description: "מיטות ומזרנים לשלושה ילדים", amount: 3800, date: "2025-05-12", projectId: "PR-05", staff: "דניאל מזרחי", status: "ממתין" },
  { id: "AS-10", familyId: "F-104", type: "בריאות", description: "השתתפות בטיפול שיניים", amount: 2200, date: "2025-04-22", staff: "דניאל מזרחי", status: "סופק" },
  { id: "AS-11", familyId: "F-105", type: "משפטי", description: "ייעוץ משפטי בנושא הכרה בתעודות מקצועיות", date: "2025-05-20", staff: "פאדי נסר", status: "ממתין" },
  { id: "AS-12", familyId: "F-106", type: "חינוך", description: "שיעורי עזר לשני ילדים", amount: 1500, date: "2025-04-05", projectId: "PR-02", staff: "ליאת אזולאי", status: "סופק" },
  { id: "AS-13", familyId: "F-107", type: "בריאות", description: "ליווי רפואי — סיום טיפול", date: "2025-02-28", staff: "נועה ברק", status: "סופק" },
];

// ============ Follow-up tasks (derived + manual) ============
export const seedFollowUps: FollowUpTask[] = [
  { id: "FU-01", entityType: "family", entityId: "F-102", entityName: "משפחת מרים", title: "ביקור בית ובדיקת מצב שכירות", dueDate: "2025-05-16", assignee: "ליאת אזולאי", status: "פתוח" },
  { id: "FU-02", entityType: "family", entityId: "F-104", entityName: "משפחת חליל", title: "אישור בקשת ריהוט מול ועדת סיוע", dueDate: "2025-05-28", assignee: "דניאל מזרחי", status: "ממתין" },
  { id: "FU-03", entityType: "supplier", entityId: "S-303", entityName: "אבי ציוד משרדי", title: "בירור חשבונית INV-3005 באיחור", dueDate: "2025-05-10", assignee: "רונית פרץ", status: "פתוח" },
  { id: "FU-04", entityType: "supplier", entityId: "S-305", entityName: 'דפוס "טופ"', title: "החלטה על חידוש התקשרות", dueDate: "2025-06-05", assignee: "שרה כהן", status: "ממתין" },
];

// ============ Donation allocations ============
export const seedAllocations: DonationAllocation[] = [
  { id: "AL-01", donationId: "DN-9001", projectId: "PR-01", amount: 50000, date: "2025-05-12", notes: "ייעוד מלא לקייטנת קיץ" },
  { id: "AL-02", donationId: "DN-9002", projectId: "PR-02", amount: 60000, date: "2025-04-28", notes: "מחזור הדרכות" },
  { id: "AL-03", donationId: "DN-9002", projectId: "PR-04", amount: 20000, date: "2025-04-29", notes: "העברה לסדנת נשים בהסכמת התורם" },
  { id: "AL-04", donationId: "DN-9003", projectId: "PR-03", amount: 12000, date: "2025-05-02" },
  { id: "AL-05", donationId: "DN-9005", projectId: "PR-04", amount: 75000, date: "2025-05-10", notes: "מענק ליבה" },
  { id: "AL-06", donationId: "DN-9007", projectId: "PR-01", amount: 22000, date: "2025-05-18" },
];
