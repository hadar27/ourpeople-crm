// Shared edit-form field definitions and audit labels per module.
// Keeping them in one place means the table row edit and the profile page edit
// always show identical fields and validation.
import type { FormField } from "@/components/entity-form-dialog";

export const ID_PATTERN = /^\d{9}$/;
export const PHONE_PATTERN = /^\d{10}$/;

export const participantFields: FormField[] = [
  { name: "name", label: "שם מלא", required: true },
  { name: "idNumber", label: "ת.ז.", required: true, maxLength: 9, pattern: ID_PATTERN, patternMessage: "ת.ז. חייבת להכיל 9 ספרות", helper: "9 ספרות" },
  { name: "phone", label: "טלפון", type: "tel", required: true, maxLength: 10, pattern: PHONE_PATTERN, patternMessage: "טלפון חייב להכיל 10 ספרות" },
  { name: "email", label: "אימייל", type: "email" },
  { name: "address", label: "כתובת" },
  { name: "city", label: "עיר" },
  { name: "activity", label: "פעילות", type: "select", required: true, options: ["קייטנת קיץ", "סדנת העצמה נשים", "ליווי משפחות", "תכנית נוער", "סיוע למשפחות עולים", "חירום ושיקום", "מועדון נוער"] },
  { name: "source", label: "מקור רישום", type: "select", required: true, options: ["טופס דיגיטלי", "QR", "אתר", "צוות פנימי", "ייבוא Excel", "API"] },
  { name: "status", label: "סטטוס רישום", type: "select", required: true, options: ["מאושר", "ממתין לתשלום", "ממתין לאישור", "טיוטה"] },
  { name: "paymentStatus", label: "סטטוס תשלום", type: "select", required: true, options: ["שולם", "שולם חלקית", "לא שולם", "לא נדרש תשלום"] },
  { name: "documentsComplete", label: "סטטוס מסמכים", type: "select", required: true, options: ["הושלמו", "חסרים"] },
  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
];

export const participantLabels: Record<string, string> = {
  name: "שם מלא", idNumber: "ת.ז.", phone: "טלפון", email: "אימייל", address: "כתובת", city: "עיר",
  activity: "פעילות", source: "מקור רישום", status: "סטטוס רישום", paymentStatus: "סטטוס תשלום",
  documentsComplete: "סטטוס מסמכים", notes: "הערות",
};

export const volunteerFields: FormField[] = [
  { name: "name", label: "שם מלא", required: true },
  { name: "phone", label: "טלפון", type: "tel", maxLength: 10, pattern: PHONE_PATTERN, patternMessage: "טלפון חייב להכיל 10 ספרות" },
  { name: "email", label: "אימייל", type: "email" },
  { name: "availability", label: "זמינות", required: true },
  { name: "project", label: "פרויקט משויך", required: true },
  { name: "hours", label: "שעות התנדבות", type: "number" },
  { name: "status", label: "סטטוס", type: "select", required: true, options: ["פעיל", "בהפסקה", "ארכיון"] },
  { name: "skills", label: "כישורים", colSpan: 2, helper: "מופרדים בפסיק", placeholder: "הדרכה, נהיגה, תרגום" },
  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
];

export const volunteerLabels: Record<string, string> = {
  name: "שם מלא", phone: "טלפון", email: "אימייל", availability: "זמינות", project: "פרויקט משויך",
  hours: "שעות התנדבות", status: "סטטוס", skills: "כישורים", notes: "הערות",
};

export const donorFields: FormField[] = [
  { name: "name", label: "שם תורם", required: true },
  { name: "contact", label: "איש קשר" },
  { name: "phone", label: "טלפון", type: "tel", maxLength: 10, pattern: PHONE_PATTERN, patternMessage: "טלפון חייב להכיל 10 ספרות" },
  { name: "email", label: "אימייל", type: "email" },
  { name: "type", label: "סוג תורם", type: "select", required: true, options: ["פרטי", "תאגיד", "קרן"] },
  { name: "address", label: "כתובת" },
  { name: "preferredChannel", label: "אופן קשר מועדף", type: "select", options: ["טלפון", 'דוא"ל', "WhatsApp", "פגישה"] },
  { name: "status", label: "סטטוס", type: "select", required: true, options: ["פעיל", "לא פעיל"] },
  { name: "interests", label: "תחומי עניין", colSpan: 2, helper: "מופרדים בפסיק" },
  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
];

export const donorLabels: Record<string, string> = {
  name: "שם תורם", contact: "איש קשר", phone: "טלפון", email: "אימייל", type: "סוג תורם",
  address: "כתובת", preferredChannel: "אופן קשר מועדף", status: "סטטוס", interests: "תחומי עניין", notes: "הערות",
};

export const interactionFields: FormField[] = [
  { name: "type", label: "סוג אינטראקציה", type: "select", required: true, options: ["שיחת טלפון", "פגישה", 'דוא"ל', "WhatsApp", "אחר"] },
  { name: "date", label: "תאריך", type: "date", required: true },
  { name: "time", label: "שעה", required: true, placeholder: "14:30" },
  { name: "staff", label: "איש צוות", required: true },
  { name: "subject", label: "נושא", required: true, colSpan: 2 },
  { name: "summary", label: "סיכום השיחה", type: "textarea", colSpan: 2 },
  { name: "outcome", label: "תוצאה", type: "textarea", colSpan: 2 },
  { name: "followUpAction", label: "פעולת המשך" },
  { name: "followUpDate", label: "תאריך המשך", type: "date" },
  { name: "status", label: "סטטוס", type: "select", required: true, options: ["פתוח", "ממתין", "הושלם"] },
];

export const interactionLabels: Record<string, string> = {
  type: "סוג אינטראקציה", date: "תאריך", time: "שעה", staff: "איש צוות", subject: "נושא",
  summary: "סיכום השיחה", outcome: "תוצאה", followUpAction: "פעולת המשך", followUpDate: "תאריך המשך", status: "סטטוס",
};

export const donationFields: FormField[] = [
  { name: "donor", label: "תורם", required: true },
  { name: "amount", label: "סכום (₪)", type: "number", required: true },
  { name: "project", label: "ייעוד / פרויקט", required: true },
  { name: "method", label: "אופן תשלום", type: "select", required: true, options: ["העברה בנקאית", "אשראי", "מזומן", "שיק"] },
  { name: "date", label: "תאריך תרומה", type: "date", required: true },
  { name: "receipt", label: "סטטוס קבלה", type: "select", required: true, options: ["הופק", "ממתין", "חסר"] },
  { name: "reference", label: "אסמכתא" },
  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
];

export const donationLabels: Record<string, string> = {
  donor: "תורם", amount: "סכום", project: "ייעוד / פרויקט", method: "אופן תשלום", date: "תאריך תרומה",
  receipt: "סטטוס קבלה", reference: "אסמכתא", notes: "הערות",
};

export const projectFields: FormField[] = [
  { name: "name", label: "שם פרויקט", required: true, colSpan: 2 },
  { name: "description", label: "תיאור", type: "textarea", colSpan: 2 },
  { name: "status", label: "סטטוס", type: "select", required: true, options: ["פעיל", "בתכנון", "הסתיים"] },
  { name: "manager", label: "מנהל/ת פרויקט", required: true },
  { name: "startDate", label: "תאריך התחלה", type: "date" },
  { name: "endDate", label: "תאריך סיום", type: "date" },
  { name: "budget", label: "תקציב מתוכנן (₪)", type: "number", required: true },
  { name: "requiredVolunteers", label: "מתנדבים נדרשים", type: "number" },
  { name: "suppliers", label: "ספקים קשורים", colSpan: 2, helper: "מופרדים בפסיק" },
  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
];

export const projectLabels: Record<string, string> = {
  name: "שם פרויקט", description: "תיאור", status: "סטטוס", manager: "מנהל/ת פרויקט",
  startDate: "תאריך התחלה", endDate: "תאריך סיום", budget: "תקציב מתוכנן",
  requiredVolunteers: "מתנדבים נדרשים", suppliers: "ספקים קשורים", notes: "הערות",
};

export const supplierFields: FormField[] = [
  { name: "name", label: "שם הספק", required: true },
  { name: "contact", label: "איש קשר", required: true },
  { name: "phone", label: "טלפון", type: "tel", maxLength: 10, pattern: PHONE_PATTERN, patternMessage: "טלפון חייב להכיל 10 ספרות" },
  { name: "email", label: "אימייל", type: "email" },
  { name: "category", label: "קטגוריה", type: "select", required: true, options: ["הסעות", "מזון", "ציוד", "תוכן", "דפוס", "תקשורת", "שיווק", "אחר"] },
  { name: "address", label: "כתובת" },
  { name: "taxId", label: "ח.פ. / עוסק", maxLength: 9 },
  { name: "paymentTerms", label: "תנאי תשלום", type: "select", options: ["מזומן", "שוטף +30", "שוטף +60", "שוטף +90"] },
  { name: "status", label: "סטטוס", type: "select", required: true, options: ["פעיל", "מושעה"] },
  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
];

export const supplierLabels: Record<string, string> = {
  name: "שם הספק", contact: "איש קשר", phone: "טלפון", email: "אימייל", category: "קטגוריה",
  address: "כתובת", taxId: "ח.פ. / עוסק", paymentTerms: "תנאי תשלום", status: "סטטוס", notes: "הערות",
};

export const familyFields: FormField[] = [
  { name: "familyName", label: "שם המשפחה", required: true },
  { name: "mainContact", label: "איש קשר ראשי", required: true },
  { name: "phone", label: "טלפון", type: "tel", required: true, maxLength: 10, pattern: PHONE_PATTERN, patternMessage: "טלפון חייב להכיל 10 ספרות" },
  { name: "email", label: "אימייל", type: "email" },
  { name: "city", label: "עיר", required: true },
  { name: "countryOfOrigin", label: "ארץ מקור", required: true },
  { name: "immigrationDate", label: "תאריך עלייה", type: "date" },
  { name: "membersCount", label: "מספר נפשות", type: "number", required: true },
  { name: "assignedStaff", label: "איש צוות מלווה", required: true },
  { name: "status", label: "סטטוס טיפול", type: "select", required: true, options: ["בטיפול פעיל", "ממתינה לאישור", "מלווה", "סגורה", "בסיכון"] },
  { name: "needs", label: "צרכי סיוע", colSpan: 2, helper: "מופרדים בפסיק — מזון, דיור, תעסוקה, חינוך, בריאות, משפטי, ריהוט, עברית" },
  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
];

export const familyLabels: Record<string, string> = {
  familyName: "שם המשפחה", mainContact: "איש קשר ראשי", phone: "טלפון", email: "אימייל", city: "עיר",
  countryOfOrigin: "ארץ מקור", immigrationDate: "תאריך עלייה", membersCount: "מספר נפשות",
  assignedStaff: "איש צוות מלווה", status: "סטטוס טיפול", needs: "צרכי סיוע", notes: "הערות",
};

export const incomeFields: FormField[] = [
  { name: "category", label: "סוג הכנסה", type: "select", required: true, options: ["תרומה", "מענק", "אגרות נרשמים", "אחר"] },
  { name: "amount", label: "סכום (₪)", type: "number", required: true },
  { name: "date", label: "תאריך", type: "date", required: true },
  { name: "source", label: "מקור", required: true, colSpan: 2 },
  { name: "donationId", label: "תרומה משויכת" },
  { name: "project", label: "פרויקט משויך" },
  { name: "method", label: "אופן תשלום", type: "select", options: ["העברה בנקאית", "אשראי", "מזומן", "שיק"] },
  { name: "reference", label: "אסמכתא" },
  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
];

export const incomeLabels: Record<string, string> = {
  category: "סוג הכנסה", amount: "סכום", date: "תאריך", source: "מקור", donationId: "תרומה משויכת",
  project: "פרויקט משויך", method: "אופן תשלום", reference: "אסמכתא", notes: "הערות",
};

export const expenseFields: FormField[] = [
  { name: "category", label: "קטגוריית הוצאה", required: true },
  { name: "amount", label: "סכום (₪)", type: "number", required: true },
  { name: "date", label: "תאריך", type: "date", required: true },
  { name: "supplier", label: "ספק" },
  { name: "project", label: "פרויקט", required: true },
  { name: "status", label: "סטטוס תשלום", type: "select", required: true, options: ["שולם", "ממתין", "חלקי"] },
  { name: "receiptStatus", label: "חשבונית / קבלה", type: "select", options: ["חשבונית התקבלה", "חסרה חשבונית", "ממתין לאישור"] },
  { name: "reference", label: "אסמכתא" },
  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
];

export const expenseLabels: Record<string, string> = {
  category: "קטגוריית הוצאה", amount: "סכום", date: "תאריך", supplier: "ספק", project: "פרויקט",
  status: "סטטוס תשלום", receiptStatus: "חשבונית / קבלה", reference: "אסמכתא", notes: "הערות",
};

export const userFields: FormField[] = [
  { name: "name", label: "שם מלא", required: true },
  { name: "email", label: "דוא״ל", type: "email", required: true },
  { name: "role", label: "תפקיד", type: "select", required: true, options: ["מנהל מערכת", "הנהלה", "מנהל כספים", "מנהל מתנדבים", "מנהל קשרי תורמים"] },
  { name: "status", label: "סטטוס", type: "select", required: true, options: ["פעיל", "מושעה"] },
  { name: "permissions", label: "הרשאות מיוחדות", colSpan: 2, helper: "מופרדות בפסיק — לדוגמה: אישור תשלומים, ייצוא דוחות" },
];

export const userLabels: Record<string, string> = {
  name: "שם מלא", email: "דוא״ל", role: "תפקיד", status: "סטטוס", permissions: "הרשאות מיוחדות",
};

export function splitList(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
