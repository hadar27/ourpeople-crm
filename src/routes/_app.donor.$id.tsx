import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Mail, Phone, Heart, Gift, MessageSquarePlus, CheckCircle2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/page-header";
import { MiniStat, SectionCard, EmptyState, Timeline, type TimelineItem } from "@/components/detail-kit";
import { FormDialog } from "@/components/form-dialog";
import { useDonor } from "@/lib/queries/donors";
import { useDonations } from "@/lib/queries/donations";
import { DonorEditButton, InteractionEditButton } from "@/components/module-edit-dialogs";
import { isOverdue, TODAY } from "@/lib/crm-seed";
import { useInteractionsForDonor, useCreateInteraction, useSetInteractionStatus } from "@/lib/queries/interactions";
import { useCreateFollowUp } from "@/lib/queries/follow-ups";
import type { InteractionType } from "@/lib/crm-types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/donor/$id")({
  component: DonorDetail,
});

const CURRENT_STAFF = "שרה כהן";

function DonorDetail() {
  const { id } = useParams({ from: "/_app/donor/$id" });
  const { data: donor, isLoading, isError } = useDonor(id);
  const { data: donations } = useDonations();
  const { data: interactionsData } = useInteractionsForDonor(id);
  const interactions = interactionsData ?? [];
  const createInteraction = useCreateInteraction();
  const createFollowUp = useCreateFollowUp();
  const setInteractionStatus = useSetInteractionStatus();

  if (isLoading) {
    return <div className="card-elevated p-8 text-center text-muted-foreground">טוען...</div>;
  }

  if (isError || !donor) {
    return (
      <div className="card-elevated p-8 text-center">
        תורם לא נמצא. <Link to="/donors" className="text-brand">חזרה</Link>
      </div>
    );
  }

  const history = (donations ?? []).filter((d) => d.donorId === donor.id);
  const sorted = [...interactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const openFollowUps = sorted.filter((i) => i.followUpDate && i.status !== "הושלם");
  const overdue = openFollowUps.filter((i) => isOverdue(i.followUpDate));
  const lastTouch = sorted[0]?.date ?? "—";

  const timeline: TimelineItem[] = sorted.map((i) => ({
    id: i.id,
    title: (
      <span className="flex items-center gap-2 flex-wrap">
        <span className="text-xs bg-secondary text-brand-deep px-2 py-0.5 rounded-full">{i.type}</span>
        {i.subject}
        <StatusBadge value={i.status} />
        <InteractionEditButton record={i} />
      </span>
    ),
    meta: `${i.staff} · ${i.date} ${i.time}`,
    date: i.date,
    tone: i.status === "הושלם" ? "good" : isOverdue(i.followUpDate) ? "danger" : "brand",
    body: (
      <div className="space-y-2">
        <p className="text-muted-foreground">{i.summary}</p>
        {i.outcome && (
          <p>
            <span className="text-xs text-muted-foreground">תוצאה: </span>
            {i.outcome}
          </p>
        )}
        {i.followUpAction && (
          <div
            className={`flex items-center justify-between gap-3 flex-wrap rounded-lg border px-3 py-2 text-xs ${
              isOverdue(i.followUpDate) && i.status !== "הושלם"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-border bg-surface-muted"
            }`}
          >
            <span className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              משימת המשך: {i.followUpAction} · יעד {i.followUpDate}
              {isOverdue(i.followUpDate) && i.status !== "הושלם" && <strong className="mr-1">· באיחור</strong>}
            </span>
            {i.status !== "הושלם" && (
              <button
                className="text-emerald-700 hover:underline flex items-center gap-1"
                onClick={async () => {
                  try {
                    await setInteractionStatus.mutateAsync({ id: i.id, status: "הושלם" });
                    toast.success("משימת ההמשך סומנה כהושלמה");
                  } catch {
                    toast.error("העדכון נכשל");
                  }
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> סמן כהושלם
              </button>
            )}
          </div>
        )}
      </div>
    ),
  }));

  const handleLog = async (v: Record<string, string>) => {
    const followUpAction = v.followUpAction || undefined;
    const followUpDate = v.followUpDate || undefined;
    const staff = v.staff || CURRENT_STAFF;
    try {
      const rec = await createInteraction.mutateAsync({
        donorId: donor.id,
        type: v.type as InteractionType,
        date: v.date || TODAY,
        time: v.time || "09:00",
        staff,
        subject: v.subject,
        summary: v.summary,
        outcome: v.outcome ?? "",
        followUpAction,
        followUpDate,
        status: followUpAction ? "פתוח" : "הושלם",
        createdAt: TODAY,
      });
      if (followUpAction && followUpDate) {
        await createFollowUp.mutateAsync({
          entityType: "donor",
          entityId: donor.id,
          entityName: donor.name,
          sourceInteractionId: rec.id,
          title: followUpAction,
          dueDate: followUpDate,
          assignee: staff,
          status: "פתוח",
        });
      }
    } catch (err) {
      return err instanceof Error ? err.message : "השמירה נכשלה";
    }
  };

  const interactionFields = [
    { name: "type", label: "סוג אינטראקציה", type: "select" as const, required: true, options: ["שיחת טלפון", "פגישה", 'דוא"ל', "WhatsApp", "אחר"] },
    { name: "date", label: "תאריך", type: "date" as const, required: true },
    { name: "time", label: "שעה", placeholder: "14:30" },
    { name: "staff", label: "איש צוות", required: true, placeholder: CURRENT_STAFF },
    { name: "subject", label: "נושא", required: true, colSpan: 2 as const },
    { name: "summary", label: "סיכום השיחה", type: "textarea" as const, required: true, colSpan: 2 as const },
    { name: "outcome", label: "תוצאה / החלטות", type: "textarea" as const, colSpan: 2 as const },
    { name: "followUpAction", label: "משימת המשך", colSpan: 2 as const, helper: "אם תוגדר משימה, האינטראקציה תיפתח כמשימה פעילה ותופיע בהתראות" },
    { name: "followUpDate", label: "תאריך יעד למשימה", type: "date" as const },
  ];

  return (
    <>
      <Link to="/donors" className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline">
        <ArrowRight className="h-4 w-4" /> חזרה לרשימת התורמים
      </Link>

      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-gradient text-white text-2xl font-bold flex items-center justify-center">
              {donor.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{donor.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{donor.id}</span>·<StatusBadge value={donor.type} />·<StatusBadge value={donor.status} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <FormDialog
              trigger={
                <Button className="bg-brand hover:bg-brand-deep gap-1">
                  <MessageSquarePlus className="h-4 w-4" /> תיעוד אינטראקציה
                </Button>
              }
              title="תיעוד אינטראקציה עם תורם"
              description={`רישום שיחה, פגישה או פנייה מול ${donor.name}, כולל משימת המשך.`}
              successMessage="האינטראקציה תועדה בהיסטוריית הקשר"
              fields={interactionFields}
              onSubmit={handleLog}
            />
            <DonorEditButton record={donor} />
            <Button variant="outline" onClick={() => toast.success("שיחה נרשמה ביומן")}>
              <Phone className="h-4 w-4 ml-1" /> חיוג
            </Button>
            <Button variant="outline" onClick={() => toast.success("פנייה נשלחה")}>
              <Mail className="h-4 w-4 ml-1" /> שלח פנייה
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <MiniStat label="סך תרומות" value={`₪${donor.totalDonated.toLocaleString()}`} icon={<Gift className="h-4 w-4" />} />
          <MiniStat label="מספר תרומות" value={String(history.length)} />
          <MiniStat label="אינטראקציה אחרונה" value={lastTouch} />
          <MiniStat
            label="משימות המשך פתוחות"
            value={String(openFollowUps.length)}
            tone={overdue.length > 0 ? "danger" : "default"}
          />
          <MiniStat label="תחומי עניין" value={donor.interests.join(", ")} icon={<Heart className="h-4 w-4" />} />
        </div>

        {overdue.length > 0 && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
            {overdue.length} משימות המשך עברו את תאריך היעד — נדרש טיפול של מנהל קשרי התורמים.
          </div>
        )}
      </div>

      <Tabs defaultValue="crm" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="crm">היסטוריית קשר ({interactions.length})</TabsTrigger>
          <TabsTrigger value="donations">תרומות ({history.length})</TabsTrigger>
          <TabsTrigger value="tasks">משימות המשך ({openFollowUps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="crm">
          <SectionCard title="יומן אינטראקציות">
            <Timeline items={timeline} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="donations">
          <SectionCard title="היסטוריית תרומות">
            {history.length === 0 ? (
              <EmptyState text="אין תרומות רשומות" />
            ) : (
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="text-right">
                    <th className="py-2">מזהה</th>
                    <th className="py-2">פרויקט</th>
                    <th className="py-2">סכום</th>
                    <th className="py-2">אמצעי</th>
                    <th className="py-2">קבלה</th>
                    <th className="py-2">תאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((d) => (
                    <tr key={d.id} className="border-t border-border hover:bg-surface-muted">
                      <td className="py-3">
                        <Link to="/donation/$id" params={{ id: d.id }} className="text-brand hover:underline font-medium">
                          {d.id}
                        </Link>
                      </td>
                      <td className="py-3">{d.project}</td>
                      <td className="py-3 font-semibold">₪{d.amount.toLocaleString()}</td>
                      <td className="py-3 text-muted-foreground">{d.method}</td>
                      <td className="py-3">
                        <StatusBadge value={d.receipt} />
                      </td>
                      <td className="py-3 text-muted-foreground">{d.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="tasks">
          <SectionCard title="משימות המשך">
            {openFollowUps.length === 0 ? (
              <EmptyState text="אין משימות המשך פתוחות" hint="כל הפניות מול התורם טופלו" />
            ) : (
              <ul className="space-y-3">
                {openFollowUps.map((i) => (
                  <li
                    key={i.id}
                    className={`flex items-center justify-between gap-3 flex-wrap rounded-lg border p-4 ${
                      isOverdue(i.followUpDate) ? "border-rose-200 bg-rose-50" : "border-border bg-surface-muted"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{i.followUpAction}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        מקור: {i.subject} · אחראי: {i.staff} · יעד: {i.followUpDate}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await setInteractionStatus.mutateAsync({ id: i.id, status: "הושלם" });
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
      </Tabs>
    </>
  );
}
