import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X, Copy, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  usePendingVolunteerRegistrations,
  usePendingParticipantRegistrations,
  useApprovePendingVolunteer,
  useApprovePendingParticipant,
  useRejectPendingRegistration,
} from "@/lib/queries/pending-registrations";
import type {
  PendingVolunteerRecord,
  PendingParticipantRecord,
} from "@/lib/queries/pending-registrations";

interface ApproveRegistrationsModalProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RegistrationDecision = "approved" | "rejected";
type RegistrationKind = "volunteer" | "participant";

type NotificationPreview = {
  name: string;
  phone?: string;
  email?: string;
  decision: RegistrationDecision;
  kind: RegistrationKind;
};

function whatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
}

export function ApproveRegistrationsModal({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ApproveRegistrationsModalProps) {
  const { data: pendingVolunteers } = usePendingVolunteerRegistrations(projectId);
  const { data: pendingParticipants } = usePendingParticipantRegistrations(projectId);
  const approvePendingVolunteer = useApprovePendingVolunteer();
  const approvePendingParticipant = useApprovePendingParticipant();
  const rejectPending = useRejectPendingRegistration();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationPreview | null>(null);

  const notificationMessage = notification
    ? notification.decision === "approved"
      ? `שלום ${notification.name},

שמחים לעדכן כי ${notification.kind === "volunteer" ? "הרשמתך להתנדבות" : "הרשמתך"} בפרויקט "${projectName}" אושרה בהצלחה.
צוות Our People ייצור איתך קשר בהמשך בנוגע לפרטי הפעילות.

בברכה,
צוות Our People`
      : `שלום ${notification.name},

תודה על הרשמתך ${notification.kind === "volunteer" ? "להתנדבות " : ""}בפרויקט "${projectName}".
לאחר בחינת הבקשה, לצערנו לא ניתן לאשר את הרשמתך בשלב זה.

בברכה,
צוות Our People`
    : "";

  const handleApproveVolunteer = async (volunteer: PendingVolunteerRecord) => {
    setApprovingId(volunteer.id);
    try {
      await approvePendingVolunteer.mutateAsync({
        pendingId: volunteer.id,
        projectId,
      });
      toast.success(`${volunteer.name} אושר כמתנדב בהצלחה!`);
      setNotification({
        name: volunteer.name,
        phone: volunteer.phone,
        email: volunteer.email,
        decision: "approved",
        kind: "volunteer",
      });
    } catch (err) {
      toast.error("שגיאה באישור המתנדב");
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleApproveParticipant = async (participant: PendingParticipantRecord) => {
    setApprovingId(participant.id);
    try {
      await approvePendingParticipant.mutateAsync({
        pendingId: participant.id,
        projectId,
      });
      toast.success(`${participant.name} אושר כמשתתף בהצלחה!`);
      setNotification({
        name: participant.name,
        phone: participant.phone,
        email: participant.email,
        decision: "approved",
        kind: "participant",
      });
    } catch (err) {
      toast.error("שגיאה באישור המשתתף");
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (
    type: RegistrationKind,
    registration: Pick<
      PendingVolunteerRecord | PendingParticipantRecord,
      "id" | "name" | "phone" | "email"
    >,
  ) => {
    setRejectingId(registration.id);
    try {
      await rejectPending.mutateAsync({
        type,
        pendingId: registration.id,
        projectId,
      });
      toast.success(`${registration.name} נדחה בהצלחה`);
      setNotification({
        name: registration.name,
        phone: registration.phone,
        email: registration.email,
        decision: "rejected",
        kind: type,
      });
    } catch (err) {
      toast.error("שגיאה בדחיית ההרשמה");
      console.error(err);
    } finally {
      setRejectingId(null);
    }
  };

  const volunteersCount = pendingVolunteers?.length ?? 0;
  const participantsCount = pendingParticipants?.length ?? 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>אישור הרשמות</DialogTitle>
            <DialogDescription>אישור או דחיית הרשמות חדשות</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="volunteers" className="w-full">
            <TabsList>
              <TabsTrigger value="volunteers">מתנדבים ({volunteersCount})</TabsTrigger>
              <TabsTrigger value="participants">משתתפים ({participantsCount})</TabsTrigger>
            </TabsList>

            {/* Volunteers Tab */}
            <TabsContent value="volunteers" className="space-y-4">
              {!pendingVolunteers || pendingVolunteers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  אין הרשמות חדשות של מתנדבים
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingVolunteers.map((volunteer) => (
                    <div key={volunteer.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{volunteer.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {volunteer.email && `${volunteer.email} • `}
                            {volunteer.phone && volunteer.phone}
                          </p>
                        </div>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {new Date(volunteer.createdAt).toLocaleDateString("he-IL")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">זמינות:</span>{" "}
                          {volunteer.availability}
                        </div>
                        <div>
                          <span className="text-muted-foreground">שעות:</span> {volunteer.hours}
                        </div>
                        {volunteer.skills.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">כישורים:</span>{" "}
                            {volunteer.skills.join(", ")}
                          </div>
                        )}
                        {volunteer.notes && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">הערות:</span> {volunteer.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveVolunteer(volunteer)}
                          disabled={approvingId === volunteer.id}
                        >
                          {approvingId === volunteer.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          אישור
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleReject("volunteer", volunteer)}
                          disabled={rejectingId === volunteer.id}
                        >
                          {rejectingId === volunteer.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          דחיה
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Participants Tab */}
            <TabsContent value="participants" className="space-y-4">
              {!pendingParticipants || pendingParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  אין הרשמות חדשות של משתתפים
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingParticipants.map((participant) => (
                    <div key={participant.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{participant.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {participant.idNumber} • {participant.phone}
                          </p>
                        </div>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {new Date(participant.createdAt).toLocaleDateString("he-IL")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">סטטוס:</span> {participant.status}
                        </div>
                        <div>
                          <span className="text-muted-foreground">תשלום:</span>{" "}
                          {participant.paymentStatus}
                        </div>
                        {participant.email && (
                          <div>
                            <span className="text-muted-foreground">דוא״ל:</span>{" "}
                            {participant.email}
                          </div>
                        )}
                        {participant.city && (
                          <div>
                            <span className="text-muted-foreground">עיר:</span> {participant.city}
                          </div>
                        )}
                        {participant.isNewImmigrant && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">עולה חדש/ה, שנת הגעה:</span>{" "}
                            {participant.immigrationYear}
                          </div>
                        )}
                        {participant.notes && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">הערות:</span>{" "}
                            {participant.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveParticipant(participant)}
                          disabled={approvingId === participant.id}
                        >
                          {approvingId === participant.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          אישור
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleReject("participant", participant)}
                          disabled={rejectingId === participant.id}
                        >
                          {rejectingId === participant.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          דחיה
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog
        open={notification !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setNotification(null);
        }}
      >
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader className="text-right">
            <DialogTitle>תצוגת הודעה לשליחה</DialogTitle>
            <DialogDescription>
              הודעת {notification?.decision === "approved" ? "אישור הרשמה" : "דחיית בקשה"} עבור{" "}
              {notification?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-surface-muted p-4 text-sm leading-7 whitespace-pre-line">
            {notificationMessage}
          </div>

          {!notification?.phone && !notification?.email && (
            <p className="text-sm text-amber-700">
              לא הוזנו טלפון או כתובת דוא״ל. ניתן להעתיק את ההודעה ולשלוח אותה ידנית.
            </p>
          )}

          <DialogFooter className="flex-wrap gap-2 sm:justify-start">
            {notification?.phone && (
              <Button asChild>
                <a
                  href={`https://wa.me/${whatsappPhone(notification.phone)}?text=${encodeURIComponent(notificationMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4 ml-1" />
                  שליחה ב־WhatsApp
                </a>
              </Button>
            )}
            {notification?.email && (
              <Button variant="outline" asChild>
                <a
                  href={`mailto:${notification.email}?subject=${encodeURIComponent(
                    notification.decision === "approved"
                      ? `אישור הרשמה לפרויקט ${projectName}`
                      : `עדכון בנוגע להרשמה לפרויקט ${projectName}`,
                  )}&body=${encodeURIComponent(notificationMessage)}`}
                >
                  <Mail className="h-4 w-4 ml-1" />
                  שליחה בדוא״ל
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(notificationMessage);
                  toast.success("ההודעה הועתקה");
                } catch {
                  toast.error("לא ניתן להעתיק את ההודעה");
                }
              }}
            >
              <Copy className="h-4 w-4 ml-1" />
              העתקה
            </Button>
            <DialogClose asChild>
              <Button variant="ghost">סגור</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
