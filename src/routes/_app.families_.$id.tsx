import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Users, HandHeart, FileText, CalendarClock, Plus, CheckCircle2, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/page-header";
import { MiniStat, SectionCard, EmptyState, Timeline, type TimelineItem } from "@/components/detail-kit";
import { FormDialog } from "@/components/form-dialog";
import { projects } from "@/lib/mock-data";
import { isOverdue, TODAY } from "@/lib/crm-seed";
import { useFamily } from "@/lib/queries/families";
import { useFamilyMembers, useCreateFamilyMember } from "@/lib/queries/family-members";
import { useAssistanceForFamily, useCreateAssistance, useSetAssistanceStatus } from "@/lib/queries/assistance";
import { useFollowUpsForEntity, useCompleteFollowUp } from "@/lib/queries/follow-ups";
import { useDocumentsForEntity } from "@/lib/queries/documents";
import type { AssistanceNeed } from "@/lib/crm-types";
import { FamilyEditButton } from "@/components/module-edit-dialogs";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/families_/$id")({
  component: FamilyProfile,
});

const NEEDS: AssistanceNeed[] = ["מזון", "דיור", "תעסוקה", "חינוך", "בריאות", "משפטי", "ריהוט", "עברית"];

function FamilyProfile() {
  const { id } = useParams({ from: "/_app/families_/$id" });
  const { data: family, isLoading, isError, refetch } = useFamily(id);
  const { data: members } = useFamilyMembers(id);
  const { data: assistance } = useAssistanceForFamily(id);
  const { data: followUps } = useFollowUpsForEntity(id);
  const { data: documentsData } = useDocumentsForEntity("family", id);
  const createFamilyMember = useCreateFamilyMember();
  const createAssistance = useCreateAssistance();
  const setAssistanceStatus = useSetAssistanceStatus();
  const completeFollowUp = useCompleteFollowUp();

  if (isLoading) {
    return (
      <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> טוען...
      </div>
    );
  }

  if (isError || !family) {
    return (
      <div className="card-elevated p-8 text-center">
        תיק משפחה לא נמצא. <Link to="/families" className="text-brand">חזרה</Link>
        {isError && (
          <button onClick={() => refetch()} className="block mx-auto mt-2 text-sm text-brand hover:underline">נסה שוב</button>
        )}
      </div>
    );
  }

  const documents = documentsData ?? [];
  const membersList = members ?? [];
  const assistanceList = assistance ?? [];
  const followUpsList = followUps ?? [];
  const sortedAid = [...assistanceList].sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalAid = sortedAid.filter((a) => a.status !== "נדחה").reduce((s, a) => s + (a.amount ?? 0), 0);
  const pending = sortedAid.filter((a) => a.status === "ממתין");
  const openTasks = followUpsList.filter((f) => f.status !== "הושלם");
  const minors = membersList.filter((m) => m.status === "קטין").length;

  const timeline: TimelineItem[] = sortedAid.map((a) => ({
    id: a.id,
    title: (
      <span className="flex items-center gap-2 flex-wrap">
        <span className="text-xs bg-secondary text-brand-deep px-2 py-0.5 rounded-full">{a.type}</span>
        {a.description}
        <StatusBadge value={a.status} />
      </span>
    ),
    meta: `${a.staff}${a.amount ? ` · ₪${a.amount.toLocaleString()}` : ""}${
      a.projectId ? ` · ${projects.find((p) => p.id === a.projectId)?.name ?? a.projectId}` : ""
    }`,
    date: a.date,
    tone: a.status === "סופק" ? "good" : a.status === "ממתין" ? "warn" : a.status === "נדחה" ? "danger" : "brand",
  }));

  const addAid = async (v: Record<string, string>) => {
    try {
      await createAssistance.mutateAsync({
        familyId: family.id,
        type: v.type as AssistanceNeed,
        description: v.description,
        amount: v.amount ? Number(v.amount) : undefined,
        date: v.date || TODAY,
        projectId: v.projectId ? projects.find((p) => p.name === v.projectId)?.id : undefined,
        staff: v.staff,
        status: "ממתין",
      });
    } catch (err) {
      return err instanceof Error ? err.message : "השמירה נכשלה";
    }
  };

  const addMember = async (v: Record<string, string>) => {
    try {
      await createFamilyMember.mutateAsync({
        familyId: family.id,
        name: v.name,
        relation: v.relation as "ראש משפחה" | "בן/בת זוג" | "ילד/ה" | "הורה" | "אחר",
        birthYear: Number(v.birthYear),
        status: v.status as "מבוגר" | "קטין" | "סטודנט" | "גמלאי",
        notes: v.notes || undefined,
      });
    } catch (err) {
      return err instanceof Error ? err.message : "השמירה נכשלה";
    }
  };

  return (
    <>
      <Link to="/families" className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline">
        <ArrowRight className="h-4 w-4" /> חזרה לרשימת המשפחות
      </Link>

      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-gradient text-white flex items-center justify-center">
              <Home className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{family.familyName}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                <span>{family.id}</span>·<span>{family.city}</span>·<span>{family.countryOfOrigin}</span>·
                <StatusBadge value={family.status} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <FamilyEditButton record={family} />
            <FormDialog
              trigger={
                <Button className="bg-brand hover:bg-brand-deep gap-1">
                  <Plus className="h-4 w-4" /> רישום סיוע
                </Button>
              }
              title="רישום סיוע למשפחה"
              description={`הוספת רשומת סיוע ל${family.familyName}. הבקשה תיפתח בסטטוס "ממתין" לאישור ועדת סיוע.`}
              successMessage="רשומת הסיוע נוספה וממתינה לאישור"
              fields={[
                { name: "type", label: "סוג סיוע", type: "select", required: true, options: NEEDS },
                { name: "amount", label: "סכום (₪)", type: "number", helper: "אם הסיוע אינו כספי — השאירו ריק" },
                { name: "description", label: "תיאור", required: true, colSpan: 2 },
                { name: "date", label: "תאריך", type: "date", required: true },
                { name: "staff", label: "איש צוות", required: true, placeholder: family.assignedStaff },
                { name: "projectId", label: "שיוך לפרויקט", type: "select", options: projects.map((p) => p.name) },
              ]}
              onSubmit={addAid}
            />
            <Button variant="outline" onClick={() => toast.success("דוח תיק משפחה יוצא ל-PDF")}>
              <FileText className="h-4 w-4 ml-1" /> ייצוא תיק
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <MiniStat label="נפשות" value={`${family.membersCount} (${minors} קטינים)`} icon={<Users className="h-4 w-4" />} />
          <MiniStat label="סך סיוע" value={`₪${totalAid.toLocaleString()}`} icon={<HandHeart className="h-4 w-4" />} />
          <MiniStat label="בקשות ממתינות" value={String(pending.length)} tone={pending.length ? "warn" : "good"} />
          <MiniStat label="רכז/ת מלווה" value={family.assignedStaff} />
          <MiniStat label="תאריך עלייה" value={family.immigrationDate} />
        </div>

        {family.notes && (
          <div className="mt-4 rounded-lg bg-surface-muted px-4 py-3 text-sm">
            <span className="text-xs text-muted-foreground">הערות רכז: </span>
            {family.notes}
          </div>
        )}
      </div>

      <Tabs defaultValue="aid" dir="rtl">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="aid">היסטוריית סיוע ({assistanceList.length})</TabsTrigger>
          <TabsTrigger value="members">בני משפחה ({membersList.length})</TabsTrigger>
          <TabsTrigger value="tasks">משימות ({openTasks.length})</TabsTrigger>
          <TabsTrigger value="docs">מסמכים ({documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="aid">
          <SectionCard title="ציר זמן סיוע">
            <Timeline items={timeline} />
            {pending.length > 0 && (
              <div className="mt-6 border-t border-border pt-4 space-y-2">
                <div className="text-sm font-semibold">בקשות הממתינות לאישור</div>
                {pending.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 flex-wrap rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
                  >
                    <span>
                      {a.type} · {a.description}
                      {a.amount ? ` · ₪${a.amount.toLocaleString()}` : ""}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await setAssistanceStatus.mutateAsync({ id: a.id, status: "אושר" });
                          toast.success("הבקשה אושרה");
                        } catch {
                          toast.error("העדכון נכשל");
                        }
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 ml-1" /> אישור
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="members">
          <SectionCard
            title="בני המשפחה"
            actions={
              <FormDialog
                trigger={
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus className="h-4 w-4" /> הוסף בן משפחה
                  </Button>
                }
                title="הוספת בן משפחה"
                successMessage="בן המשפחה נוסף לתיק"
                fields={[
                  { name: "name", label: "שם מלא", required: true },
                  { name: "relation", label: "קרבה", type: "select", required: true, options: ["ראש משפחה", "בן/בת זוג", "ילד/ה", "הורה", "אחר"] },
                  { name: "birthYear", label: "שנת לידה", type: "number", required: true },
                  { name: "status", label: "מעמד", type: "select", required: true, options: ["מבוגר", "קטין", "סטודנט", "גמלאי"] },
                  { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
                ]}
                onSubmit={addMember}
              />
            }
          >
            {membersList.length === 0 ? (
              <EmptyState text="לא נרשמו בני משפחה" />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="text-right">
                    <th className="py-2 font-medium">שם</th>
                    <th className="py-2 font-medium">קרבה</th>
                    <th className="py-2 font-medium">שנת לידה</th>
                    <th className="py-2 font-medium">מעמד</th>
                    <th className="py-2 font-medium">הערות</th>
                  </tr>
                </thead>
                <tbody>
                  {membersList.map((m) => (
                    <tr key={m.id} className="border-t border-border hover:bg-surface-muted">
                      <td className="py-3 font-medium">{m.name}</td>
                      <td className="py-3">{m.relation}</td>
                      <td className="py-3 tabular-nums">{m.birthYear}</td>
                      <td className="py-3">
                        <StatusBadge value={m.status} />
                      </td>
                      <td className="py-3 text-muted-foreground">{m.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="tasks">
          <SectionCard title="משימות מעקב">
            {openTasks.length === 0 ? (
              <EmptyState text="אין משימות פתוחות" />
            ) : (
              <ul className="space-y-3">
                {openTasks.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-center justify-between gap-3 flex-wrap rounded-lg border p-4 ${
                      isOverdue(t.dueDate) ? "border-rose-200 bg-rose-50" : "border-border bg-surface-muted"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" /> יעד {t.dueDate} · אחראי {t.assignee}
                        {isOverdue(t.dueDate) && <span className="text-rose-600 font-medium">· באיחור</span>}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await completeFollowUp.mutateAsync(t.id);
                          toast.success("המשימה הושלמה");
                        } catch {
                          toast.error("העדכון נכשל");
                        }
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 ml-1" /> סיום
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="docs">
          <SectionCard title="מסמכים">
            {documents.length === 0 ? (
              <EmptyState text="אין מסמכים בתיק" />
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3">
                    <FileText className="h-5 w-5 text-brand shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.kind} · {d.uploadedAt} · {d.uploadedBy}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  );
}
