// Mock data for the Our People nonprofit ERP/CRM platform.
// All data is in-memory only — no backend integration yet.

export type RegistrationSource = "טופס דיגיטלי" | "QR" | "אתר" | "צוות פנימי" | "ייבוא Excel" | "API";
export type RegistrationStatus = "מאושר" | "ממתין לתשלום" | "ממתין לאישור" | "טיוטה";
export type ParticipantPayment = "שולם" | "שולם חלקית" | "לא שולם" | "לא נדרש תשלום";

export type Participant = {
  id: string;
  name: string;
  idNumber: string;
  phone: string;
  activity: string;
  activityType: "חינמית" | "בתשלום";
  status: RegistrationStatus;
  paymentStatus: ParticipantPayment;
  source: RegistrationSource;
  registrationDate: string;
  documentsComplete: boolean;
  isNewImmigrant?: boolean;
  immigrationYear?: number;
};

export const activitiesCatalog: { name: string; type: "חינמית" | "בתשלום"; price: number }[] = [
  { name: "קייטנת קיץ", type: "בתשלום", price: 850 },
  { name: "סדנת העצמה נשים", type: "בתשלום", price: 300 },
  { name: "ליווי משפחות", type: "חינמית", price: 0 },
  { name: "תכנית נוער", type: "בתשלום", price: 200 },
  { name: "סיוע למשפחות עולים", type: "חינמית", price: 0 },
  { name: "חירום ושיקום", type: "חינמית", price: 0 },
  { name: "מועדון נוער", type: "חינמית", price: 0 },
];

export const participants: Participant[] = [
  { id: "P-1001", name: "מירב כהן", idNumber: "302145678", phone: "0501234567", activity: "קייטנת קיץ", activityType: "בתשלום", status: "מאושר", paymentStatus: "שולם", source: "טופס דיגיטלי", registrationDate: "2025-05-12", documentsComplete: true },
  { id: "P-1002", name: "אחמד עבדאללה", idNumber: "315678234", phone: "0527788991", activity: "סדנת העצמה נשים", activityType: "בתשלום", status: "ממתין לתשלום", paymentStatus: "שולם חלקית", source: "QR", registrationDate: "2025-05-18", documentsComplete: true },
  { id: "P-1003", name: "נטלי לוי", idNumber: "208934512", phone: "0541239876", activity: "ליווי משפחות", activityType: "חינמית", status: "ממתין לאישור", paymentStatus: "לא נדרש תשלום", source: "אתר", registrationDate: "2025-05-20", documentsComplete: false },
  { id: "P-1004", name: "יוסי בן דוד", idNumber: "311223344", phone: "0509988776", activity: "תכנית נוער", activityType: "בתשלום", status: "מאושר", paymentStatus: "שולם", source: "צוות פנימי", registrationDate: "2025-04-30", documentsComplete: true },
  { id: "P-1005", name: "סוזן מרים", idNumber: "327654321", phone: "0533344556", activity: "סיוע למשפחות עולים", activityType: "חינמית", status: "ממתין לאישור", paymentStatus: "לא נדרש תשלום", source: "ייבוא Excel", registrationDate: "2025-05-05", documentsComplete: false, isNewImmigrant: true, immigrationYear: 2022 },
  { id: "P-1006", name: "דנה אברמוב", idNumber: "318877665", phone: "0521122334", activity: "קייטנת קיץ", activityType: "בתשלום", status: "מאושר", paymentStatus: "שולם", source: "טופס דיגיטלי", registrationDate: "2025-05-15", documentsComplete: true, isNewImmigrant: true, immigrationYear: 2018 },
  { id: "P-1007", name: "מוחמד חליל", idNumber: "330011223", phone: "0544455667", activity: "חירום ושיקום", activityType: "חינמית", status: "מאושר", paymentStatus: "לא נדרש תשלום", source: "API", registrationDate: "2025-05-21", documentsComplete: true },
  { id: "P-1008", name: "רחל פרידמן", idNumber: "298877665", phone: "0507788990", activity: "תכנית נוער", activityType: "בתשלום", status: "ממתין לתשלום", paymentStatus: "לא שולם", source: "טופס דיגיטלי", registrationDate: "2025-05-22", documentsComplete: false },
  { id: "P-1009", name: "אלינור בקר", idNumber: "320099887", phone: "0508877665", activity: "קייטנת קיץ", activityType: "בתשלום", status: "מאושר", paymentStatus: "שולם", source: "QR", registrationDate: "2025-05-23", documentsComplete: true, isNewImmigrant: true, immigrationYear: 2023 },
];

export type Volunteer = {
  id: string;
  name: string;
  availability: string;
  project: string;
  hours: number;
  status: "פעיל" | "בהפסקה" | "ארכיון";
  skills: string[];
};

export const volunteers: Volunteer[] = [
  { id: "V-201", name: "אורן שטרן", availability: "ערבים + סופ״ש", project: "קייטנת קיץ", hours: 124, status: "פעיל", skills: ["הדרכה", "עברית", "ספורט"] },
  { id: "V-202", name: "ליאת אזולאי", availability: "ימים א׳–ה׳", project: "ליווי משפחות", hours: 86, status: "פעיל", skills: ["עו״ס", "ערבית"] },
  { id: "V-203", name: "דניאל מזרחי", availability: "סופי שבוע", project: "חירום ושיקום", hours: 42, status: "פעיל", skills: ["נהיגה", "לוגיסטיקה"] },
  { id: "V-204", name: "נועה ברק", availability: "בקרים", project: "סדנת העצמה נשים", hours: 67, status: "פעיל", skills: ["פסיכולוגיה", "אנגלית"] },
  { id: "V-205", name: "תומר רז", availability: "גמיש", project: "תכנית נוער", hours: 15, status: "בהפסקה", skills: ["מוזיקה"] },
  { id: "V-206", name: "פאדי נסר", availability: "ערבים", project: "סיוע לעולים", hours: 92, status: "פעיל", skills: ["תרגום", "ערבית", "רוסית"] },
];

export type Donor = {
  id: string;
  name: string;
  type: "פרטי" | "תאגיד" | "קרן";
  totalDonated: number;
  lastDonation: string;
  interests: string[];
  status: "פעיל" | "לא פעיל";
};

export const donors: Donor[] = [
  { id: "D-501", name: 'קרן הירש לצדקה', type: "קרן", totalDonated: 250000, lastDonation: "2025-04-12", interests: ["נוער", "חינוך"], status: "פעיל" },
  { id: "D-502", name: "חברת טכנולגיה בע״מ", type: "תאגיד", totalDonated: 180000, lastDonation: "2025-03-28", interests: ["העצמה", "תעסוקה"], status: "פעיל" },
  { id: "D-503", name: "משפחת לוינסון", type: "פרטי", totalDonated: 42000, lastDonation: "2025-05-02", interests: ["משפחות"], status: "פעיל" },
  { id: "D-504", name: "אבי גולדמן", type: "פרטי", totalDonated: 15000, lastDonation: "2024-12-15", interests: ["חירום"], status: "פעיל" },
  { id: "D-505", name: 'קרן "אור"', type: "קרן", totalDonated: 320000, lastDonation: "2025-05-10", interests: ["נשים", "עולים"], status: "פעיל" },
  { id: "D-506", name: "מירי בלום", type: "פרטי", totalDonated: 5400, lastDonation: "2024-11-04", interests: ["נוער"], status: "לא פעיל" },
];

export type Donation = {
  id: string;
  donor: string;
  amount: number;
  project: string;
  method: "העברה בנקאית" | "אשראי" | "מזומן" | "שיק";
  receipt: "הופק" | "ממתין" | "חסר";
  date: string;
};

export const donations: Donation[] = [
  { id: "DN-9001", donor: "קרן הירש לצדקה", amount: 50000, project: "קייטנת קיץ 2025", method: "העברה בנקאית", receipt: "הופק", date: "2025-05-12" },
  { id: "DN-9002", donor: "חברת טכנולגיה בע״מ", amount: 80000, project: "תכנית נוער", method: "העברה בנקאית", receipt: "הופק", date: "2025-04-28" },
  { id: "DN-9003", donor: "משפחת לוינסון", amount: 12000, project: "ליווי משפחות", method: "אשראי", receipt: "הופק", date: "2025-05-02" },
  { id: "DN-9004", donor: "אבי גולדמן", amount: 5000, project: "חירום ושיקום", method: "שיק", receipt: "ממתין", date: "2025-05-15" },
  { id: "DN-9005", donor: 'קרן "אור"', amount: 120000, project: "סדנת העצמה נשים", method: "העברה בנקאית", receipt: "הופק", date: "2025-05-10" },
  { id: "DN-9006", donor: "מירי בלום", amount: 1800, project: "סיוע לעולים", method: "אשראי", receipt: "חסר", date: "2025-05-08" },
  { id: "DN-9007", donor: "תורם אנונימי", amount: 22000, project: "קייטנת קיץ 2025", method: "העברה בנקאית", receipt: "הופק", date: "2025-05-18" },
];

export type Project = {
  id: string;
  name: string;
  status: "פעיל" | "בתכנון" | "הסתיים";
  budget: number;
  spent: number;
  progress: number;
  volunteers: number;
  manager: string;
};

export const projects: Project[] = [
  { id: "PR-01", name: "קייטנת קיץ 2025", status: "פעיל", budget: 320000, spent: 184000, progress: 62, volunteers: 24, manager: "ליאת אזולאי" },
  { id: "PR-02", name: "תכנית נוער שכונתית", status: "פעיל", budget: 180000, spent: 92000, progress: 48, volunteers: 12, manager: "אורן שטרן" },
  { id: "PR-03", name: "ליווי משפחות עולים", status: "פעיל", budget: 220000, spent: 210000, progress: 88, volunteers: 18, manager: "פאדי נסר" },
  { id: "PR-04", name: "סדנת העצמה לנשים", status: "פעיל", budget: 95000, spent: 38000, progress: 40, volunteers: 8, manager: "נועה ברק" },
  { id: "PR-05", name: "חירום ושיקום קהילתי", status: "בתכנון", budget: 410000, spent: 12000, progress: 5, volunteers: 6, manager: "דניאל מזרחי" },
  { id: "PR-06", name: "מועדונית אחה״צ", status: "הסתיים", budget: 140000, spent: 138000, progress: 100, volunteers: 14, manager: "ליאת אזולאי" },
];

export type Task = { id: string; title: string; project: string; assignee: string; column: "todo" | "doing" | "done" };
export const tasks: Task[] = [
  { id: "T-1", title: "אישור תקציב קייטנה", project: "קייטנת קיץ 2025", assignee: "ליאת אזולאי", column: "todo" },
  { id: "T-2", title: "גיוס 5 מתנדבים נוספים", project: "תכנית נוער שכונתית", assignee: "אורן שטרן", column: "todo" },
  { id: "T-3", title: "תיאום הסעות", project: "קייטנת קיץ 2025", assignee: "דניאל מזרחי", column: "doing" },
  { id: "T-4", title: "סדנה ראשונה", project: "סדנת העצמה לנשים", assignee: "נועה ברק", column: "doing" },
  { id: "T-5", title: "חלוקת ערכות חירום", project: "חירום ושיקום קהילתי", assignee: "פאדי נסר", column: "doing" },
  { id: "T-6", title: "סיכום רבעון Q1", project: "ליווי משפחות עולים", assignee: "פאדי נסר", column: "done" },
  { id: "T-7", title: "דוח מתנדבים אפריל", project: "תכנית נוער שכונתית", assignee: "אורן שטרן", column: "done" },
];

export type Supplier = {
  id: string;
  name: string;
  category: string;
  contact: string;
  contracts: number;
  openInvoices: number;
  status: "פעיל" | "מושעה";
};

export const suppliers: Supplier[] = [
  { id: "S-301", name: 'הסעות "דרך"', category: "הסעות", contact: "0501112222", contracts: 3, openInvoices: 1, status: "פעיל" },
  { id: "S-302", name: "קייטרינג בית חם", category: "מזון", contact: "0523334444", contracts: 2, openInvoices: 0, status: "פעיל" },
  { id: "S-303", name: "אבי ציוד משרדי", category: "ציוד", contact: "0545556666", contracts: 1, openInvoices: 2, status: "פעיל" },
  { id: "S-304", name: "סדנאות חוץ בע״מ", category: "תוכן", contact: "0567778888", contracts: 4, openInvoices: 0, status: "פעיל" },
  { id: "S-305", name: 'דפוס "טופ"', category: "דפוס", contact: "0509990000", contracts: 1, openInvoices: 1, status: "מושעה" },
];

export type Alert = {
  id: string;
  title: string;
  severity: "גבוהה" | "בינונית" | "נמוכה";
  module: string;
  rule: string;
  createdAt: string;
};

export const alerts: Alert[] = [
  { id: "A-01", title: 'חוסר מתנדבים בפרויקט "קייטנת קיץ 2025"', severity: "גבוהה", module: "מתנדבים", rule: "פחות מ-20 מתנדבים פעילים", createdAt: "2025-05-18" },
  { id: "A-02", title: "חריגת תקציב בליווי משפחות עולים", severity: "גבוהה", module: "כספים", rule: "ניצול > 90% מהתקציב", createdAt: "2025-05-17" },
  { id: "A-03", title: "תרומה ללא קבלה — מירי בלום", severity: "בינונית", module: "תרומות", rule: "תרומה ללא קבלה > 7 ימים", createdAt: "2025-05-16" },
  { id: "A-04", title: 'איחור בתשלום לספק "אבי ציוד משרדי"', severity: "בינונית", module: "ספקים", rule: "חשבונית פתוחה > 30 יום", createdAt: "2025-05-15" },
  { id: "A-05", title: "עומס פעילות בנובמבר", severity: "נמוכה", module: "פרויקטים", rule: "מעל 4 פרויקטים מקבילים", createdAt: "2025-05-14" },
];

export type User = {
  id: string;
  name: string;
  email: string;
  role: "מנהל מערכת" | "הנהלה" | "מנהל כספים" | "מנהל מתנדבים" | "מנהל קשרי תורמים";
  status: "פעיל" | "מושעה";
  lastLogin: string;
};

export const users: User[] = [
  { id: "U-1", name: "שרה כהן", email: "sarah@ourpeople.org", role: "מנהל מערכת", status: "פעיל", lastLogin: "2025-05-20" },
  { id: "U-2", name: "דוד לוי", email: "david@ourpeople.org", role: "הנהלה", status: "פעיל", lastLogin: "2025-05-19" },
  { id: "U-3", name: "רונית פרץ", email: "ronit@ourpeople.org", role: "מנהל כספים", status: "פעיל", lastLogin: "2025-05-20" },
  { id: "U-4", name: "אורן שטרן", email: "oren@ourpeople.org", role: "מנהל מתנדבים", status: "פעיל", lastLogin: "2025-05-18" },
  { id: "U-5", name: "מאיה גרין", email: "maya@ourpeople.org", role: "מנהל קשרי תורמים", status: "פעיל", lastLogin: "2025-05-17" },
  { id: "U-6", name: "יואב סבן", email: "yoav@ourpeople.org", role: "הנהלה", status: "מושעה", lastLogin: "2025-04-30" },
];

export const permissionsMatrix: { module: string; admin: boolean; mgmt: boolean; finance: boolean; volunteers: boolean; donors: boolean }[] = [
  { module: "לוח בקרה", admin: true, mgmt: true, finance: true, volunteers: true, donors: true },
  { module: "נרשמים", admin: true, mgmt: true, finance: false, volunteers: true, donors: false },
  { module: "מתנדבים", admin: true, mgmt: true, finance: false, volunteers: true, donors: false },
  { module: "תורמים", admin: true, mgmt: true, finance: true, volunteers: false, donors: true },
  { module: "תרומות", admin: true, mgmt: true, finance: true, volunteers: false, donors: true },
  { module: "פרויקטים", admin: true, mgmt: true, finance: true, volunteers: true, donors: false },
  { module: "ספקים", admin: true, mgmt: true, finance: true, volunteers: false, donors: false },
  { module: "כספים (ERP)", admin: true, mgmt: true, finance: true, volunteers: false, donors: false },
  { module: "התראות", admin: true, mgmt: true, finance: true, volunteers: true, donors: true },
  { module: 'דוחות KPI', admin: true, mgmt: true, finance: true, volunteers: false, donors: false },
  { module: "משתמשים והרשאות", admin: true, mgmt: false, finance: false, volunteers: false, donors: false },
];

// Charts data
export const monthlyDonations = [
  { month: "ינו׳", amount: 145000 },
  { month: "פבר׳", amount: 168000 },
  { month: "מרץ", amount: 192000 },
  { month: "אפר׳", amount: 175000 },
  { month: "מאי", amount: 238000 },
  { month: "יוני", amount: 210000 },
];

export const budgetVsActual = [
  { project: "קייטנת קיץ", budget: 320000, actual: 184000 },
  { project: "תכנית נוער", budget: 180000, actual: 92000 },
  { project: "ליווי משפחות", budget: 220000, actual: 210000 },
  { project: "העצמת נשים", budget: 95000, actual: 38000 },
  { project: "חירום ושיקום", budget: 410000, actual: 12000 },
];

export const projectMix = [
  { name: "נוער", value: 32 },
  { name: "נשים", value: 18 },
  { name: "משפחות", value: 27 },
  { name: "חירום", value: 13 },
  { name: "עולים", value: 10 },
];

// Israeli ID validation (9 digits)
export function isValidIsraeliId(value: string): boolean {
  return /^\d{9}$/.test(value);
}
export function isValidPhone(value: string): boolean {
  return /^\d{10}$/.test(value);
}
