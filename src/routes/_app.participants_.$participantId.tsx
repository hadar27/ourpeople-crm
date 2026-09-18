import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  FileWarning,
  Globe2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/page-header";
import { MiniStat, SectionCard, EmptyState, RecordNotFound } from "@/components/detail-kit";
import {
  type ParticipantProjectRecord,
  useParticipant,
  useProjectsForParticipant,
} from "@/lib/queries/participants";
import { useProjects } from "@/lib/queries/projects";
import { ParticipantEditButton } from "@/components/module-edit-dialogs";
import { Loader2 } from "lucide-react";
import { EntityDocumentsPanel } from "@/components/entity-documents-panel";

export const Route = createFileRoute("/_app/participants_/$participantId")({
  component: ParticipantProfile,
  head: () => ({
    meta: [
      { title: "כרטיס נרשם | Our People" },
      {
        name: "description",
        content: "כרטיס משתתף: פרטי רישום, סטטוס תשלום, מסמכים ופעילות משויכת.",
      },
      { property: "og:title", content: "כרטיס נרשם | Our People" },
      {
        property: "og:description",
        content: "פרטי רישום, תשלום ומסמכים של משתתף בפעילויות העמותה.",
      },
    ],
  }),
});

function ParticipantProfile() {
  const { participantId } = useParams({ from: "/_app/participants_/$participantId" });
  const { data: participant, isLoading, isError, refetch } = useParticipant(participantId);
  const { data: assignedProjects } = useProjectsForParticipant(participantId);
  const { data: projects } = useProjects();

  if (isLoading) {
    return (
      <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> טוען...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card-elevated flex flex-col items-center gap-3 p-16 text-center">
        <div className="text-sm text-muted-foreground">אירעה שגיאה בטעינת הנרשם.</div>
        <button onClick={() => refetch()} className="text-sm text-brand hover:underline">
          נסה שוב
        </button>
      </div>
    );
  }

  if (!participant) {
    return (
      <RecordNotFound
        title="הנרשם לא נמצא"
        description={`לא קיימת רשומת נרשם עם המזהה ${participantId}. ייתכן שהרשומה נמחקה או שהקישור שגוי.`}
        backTo="/participants"
        backLabel="חזרה לרשימת הנרשמים"
      />
    );
  }

  const price = participant.projectPrice;
  const relatedProject = (projects ?? []).find((p) => p.id === participant.projectId);
  const projectsById = new Map<string, ParticipantProjectRecord>();

  if (relatedProject) {
    projectsById.set(relatedProject.id, {
      id: relatedProject.id,
      name: relatedProject.name,
      status: relatedProject.status,
      startDate: relatedProject.startDate,
      endDate: relatedProject.endDate,
    });
  }

  for (const project of assignedProjects ?? []) {
    projectsById.set(project.id, project);
  }

  const participantProjects = Array.from(projectsById.values()).sort((first, second) =>
    (second.startDate ?? "").localeCompare(first.startDate ?? ""),
  );

  const paidFully =
    participant.paymentStatus === "שולם" || participant.paymentStatus === "לא נדרש תשלום";
  const balance = paidFully
    ? 0
    : participant.paymentStatus === "שולם חלקית"
      ? Math.round(price / 2)
      : price;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/participants"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand mb-2"
          >
            <ArrowRight className="h-3.5 w-3.5" /> חזרה לרשימת הנרשמים
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brand-gradient text-white grid place-items-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-deep">{participant.name}</h1>
              <div className="text-sm text-muted-foreground">
                {participant.id} · ת.ז. {participant.idNumber}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ParticipantEditButton record={participant} />
          <StatusBadge value={participant.status} />
          <StatusBadge value={participant.paymentStatus} />
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MiniStat
          icon={<CalendarClock className="h-4 w-4" />}
          label="תאריך רישום"
          value={participant.registrationDate}
        />
        <MiniStat
          icon={<CreditCard className="h-4 w-4" />}
          label="עלות הפעילות"
          value={price ? `₪${price.toLocaleString()}` : "ללא עלות"}
        />
        <MiniStat
          icon={<CreditCard className="h-4 w-4" />}
          label="יתרה לתשלום"
          value={balance ? `₪${balance.toLocaleString()}` : "₪0"}
          tone={balance ? "warn" : "good"}
        />
        <MiniStat
          icon={
            participant.documentsComplete ? (
              <BadgeCheck className="h-4 w-4" />
            ) : (
              <FileWarning className="h-4 w-4" />
            )
          }
          label="מסמכים"
          value={participant.documentsComplete ? "הושלמו" : "חסרים"}
          tone={participant.documentsComplete ? "good" : "warn"}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="פרטי קשר" icon={<Phone className="h-4 w-4" />}>
          <div className="divide-y divide-border text-sm">
            <Row label="טלפון" value={participant.phone} />
            <Row label="אימייל" value="—" icon={<Mail className="h-3.5 w-3.5" />} />
            <Row
              label="מקור רישום"
              value={participant.source}
              icon={<Globe2 className="h-3.5 w-3.5" />}
            />
            <Row
              label="עולה חדש/ה"
              value={
                participant.isNewImmigrant
                  ? `כן · שנת עלייה ${participant.immigrationYear ?? "—"}`
                  : "לא"
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="פרויקטים נוכחיים וקודמים" icon={<CalendarClock className="h-4 w-4" />}>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">סטטוס רישום</span>
            <StatusBadge value={participant.status} />
          </div>
          {participantProjects.length ? (
            <div className="space-y-3">
              {participantProjects.map((project) => (
                <div key={project.id} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to="/project/$id"
                      params={{ id: project.id }}
                      className="font-medium text-brand hover:underline"
                    >
                      {project.name}
                    </Link>
                    <StatusBadge value={project.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>התחלה: {formatDate(project.startDate)}</span>
                    <span>סיום: {formatDate(project.endDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="אין פרויקטים משויכים" hint="ניתן לשייך את הנרשם מתוך עמוד הפרויקט." />
          )}
        </SectionCard>

        <div className="lg:col-span-2">
          <EntityDocumentsPanel entityType="participant" entityId={participant.id} />
        </div>
      </div>

      <div className="mt-6">
        <Button asChild variant="outline">
          <Link to="/participants">חזרה לרשימת הנרשמים</Link>
        </Button>
      </div>
    </>
  );
}

function formatDate(date?: string) {
  if (!date) return "לא נקבע";
  return new Intl.DateTimeFormat("he-IL").format(new Date(`${date}T12:00:00`));
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon} {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
