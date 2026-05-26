import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { CalendarClock, CreditCard, UserPlus, FileWarning, Globe2, QrCode, Sparkles, Database, Upload, Users as UsersIcon } from "lucide-react";
import { participants, activitiesCatalog, type Participant, type RegistrationSource } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/participants")({
  component: ParticipantsPage,
});

function SourceBadge({ source }: { source: RegistrationSource }) {
  const map: Record<RegistrationSource, { icon: React.ReactNode; cls: string }> = {
    "טופס דיגיטלי": { icon: <Sparkles className="h-3 w-3" />, cls: "bg-brand-light text-brand-deep border-brand/20" },
    "QR": { icon: <QrCode className="h-3 w-3" />, cls: "bg-violet-50 text-violet-700 border-violet-200" },
    "אתר": { icon: <Globe2 className="h-3 w-3" />, cls: "bg-sky-50 text-sky-700 border-sky-200" },
    "צוות פנימי": { icon: <UsersIcon className="h-3 w-3" />, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    "ייבוא Excel": { icon: <Upload className="h-3 w-3" />, cls: "bg-amber-50 text-amber-700 border-amber-200" },
    "API": { icon: <Database className="h-3 w-3" />, cls: "bg-slate-100 text-slate-700 border-slate-200" },
  };
  const m = map[source];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>
      {m.icon} {source}
    </span>
  );
}

const columns: Column<Participant>[] = [
  { key: "name", header: "שם מלא", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "idNumber", header: "ת.ז." },
  { key: "phone", header: "טלפון" },
  { key: "activity", header: "פעילות", render: (r) => (
    <div className="flex flex-col">
      <span>{r.activity}</span>
      <span className="text-[11px] text-muted-foreground">{r.activityType}</span>
    </div>
  )},
  { key: "source", header: "מקור רישום", render: (r) => <SourceBadge source={r.source} /> },
  { key: "registrationDate", header: "תאריך רישום" },
  { key: "status", header: "סטטוס", render: (r) => <StatusBadge value={r.status} /> },
  { key: "paymentStatus", header: "תשלום", render: (r) => <StatusBadge value={r.paymentStatus} /> },
  { key: "documentsComplete", header: "מסמכים", render: (r) => (
    r.documentsComplete
      ? <span className="text-emerald-700 text-xs font-medium">הושלמו</span>
      : <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium"><FileWarning className="h-3 w-3" /> חסרים</span>
  )},
];

function ParticipantsPage() {
  // Operational KPIs derived from data
  const thisWeek = participants.length; // mock "upcoming this week"
  const needPayment = participants.filter((p) => p.paymentStatus === "לא שולם" || p.paymentStatus === "שולם חלקית").length;
  const recent = participants.filter((p) => new Date(p.registrationDate) >= new Date("2025-05-18")).length;
  const missingDocs = participants.filter((p) => !p.documentsComplete).length;
  const newImmigrants = participants.filter((p) => p.isNewImmigrant).length;

  const activityNames = activitiesCatalog.map((a) => a.name);

  return (
    <>
      <PageHeader
        title="ניהול נרשמים"
        description="רישום, אימות, מסמכים ותשלום עבור משתתפי הפעילויות והפרויקטים."
        actions={
          <EntityFormDialog
            triggerLabel="הוסף נרשם"
            title="רישום משתתף חדש"
            description="הזן את פרטי המשתתף. רישום לפעילות בתשלום יאושר רק לאחר השלמת תשלום."
            successMessage="המשתתף נרשם בהצלחה במערכת"
            customValidate={(v) => {
              const activity = v["activity"];
              const def = activitiesCatalog.find((a) => a.name === activity);
              if (def?.type === "בתשלום") {
                const pay = v["paymentStatus"];
                if (!pay || pay === "לא שולם" || pay === "שולם חלקית") {
                  return "פעילות בתשלום — לא ניתן לאשר רישום ללא תשלום מלא";
                }
              }
              return null;
            }}
            fields={[
              { name: "fullName", label: "שם מלא", required: true, placeholder: "ישראל ישראלי" },
              { name: "idNumber", label: "תעודת זהות", required: true, placeholder: "9 ספרות", pattern: /^\d{9}$/, patternMessage: "ת.ז. חייבת להכיל 9 ספרות בדיוק", maxLength: 9, helper: "9 ספרות, ללא מקפים" },
              { name: "phone", label: "טלפון נייד", type: "tel", required: true, placeholder: "0500000000", pattern: /^\d{10}$/, patternMessage: "טלפון חייב להכיל 10 ספרות בדיוק", maxLength: 10 },
              { name: "email", label: "אימייל", type: "email", placeholder: "name@example.com" },
              { name: "activity", label: "פעילות", type: "select", required: true, options: activityNames, helper: "פעילות בתשלום דורשת תשלום מלא לפני אישור" },
              { name: "source", label: "מקור רישום", type: "select", required: true, options: ["טופס דיגיטלי", "QR", "אתר", "צוות פנימי", "ייבוא Excel", "API"] },
              { name: "paymentStatus", label: "סטטוס תשלום", type: "select", required: true, options: ["לא נדרש תשלום", "לא שולם", "שולם חלקית", "שולם"] },
              { name: "documents", label: "מסמכים שהוגשו", type: "select", options: ["הושלמו", "חסרים"] },
              { name: "immigrationYear", label: "שנת עלייה (אם רלוונטי)", type: "number", placeholder: "לדוגמה: 2022" },
              { name: "notes", label: "הערות", type: "textarea", colSpan: 2, placeholder: "הערות נוספות..." },
            ]}
          />
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <Op icon={<CalendarClock className="h-4 w-4" />} label="פעילויות בשבוע הקרוב" value={String(thisWeek)} tone="brand" />
        <Op icon={<CreditCard className="h-4 w-4" />} label="ממתינים להשלמת תשלום" value={String(needPayment)} tone="warn" />
        <Op icon={<UserPlus className="h-4 w-4" />} label="נרשמו לאחרונה" value={String(recent)} />
        <Op icon={<FileWarning className="h-4 w-4" />} label="חסרים מסמכים" value={String(missingDocs)} tone="warn" />
        <Op icon={<UsersIcon className="h-4 w-4" />} label="עולים חדשים החודש" value={String(newImmigrants)} />
      </div>

      <DataTable
        rows={participants}
        columns={columns}
        searchKeys={["name", "idNumber", "phone", "activity"]}
      />
    </>
  );
}

function Op({
  icon, label, value, tone = "default",
}: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "brand" | "warn" }) {
  const toneCls =
    tone === "brand"
      ? "bg-brand-gradient text-white border-transparent"
      : tone === "warn"
        ? "bg-amber-50 border-amber-200"
        : "bg-card";
  const labelCls = tone === "brand" ? "text-white/85" : "text-muted-foreground";
  const iconWrap = tone === "brand" ? "bg-white/15 text-white" : "bg-secondary text-brand-deep";
  return (
    <div className={`rounded-xl border border-border p-4 shadow-soft ${toneCls}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-xs ${labelCls}`}>{label}</div>
          <div className="text-2xl font-bold mt-1.5">{value}</div>
        </div>
        <div className={`p-2 rounded-lg ${iconWrap}`}>{icon}</div>
      </div>
    </div>
  );
}
