import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X } from "lucide-react";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApproveRegistrationsModal({
  projectId,
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

  const handleApproveVolunteer = async (volunteer: PendingVolunteerRecord) => {
    setApprovingId(volunteer.id);
    try {
      await approvePendingVolunteer.mutateAsync({
        pendingId: volunteer.id,
        projectId,
      });
      toast.success(`${volunteer.name} אושר כמתנדב בהצלחה!`);
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
    } catch (err) {
      toast.error("שגיאה באישור המשתתף");
      console.error(err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (type: "volunteer" | "participant", id: string, name: string) => {
    setRejectingId(id);
    try {
      await rejectPending.mutateAsync({ type, pendingId: id, projectId });
      toast.success(`${name} נדחה בהצלחה`);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>אישור הרשמות</DialogTitle>
          <DialogDescription>
            אישור או דחיית הרשמות חדשות
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="volunteers" className="w-full">
          <TabsList>
            <TabsTrigger value="volunteers">
              מתנדבים ({volunteersCount})
            </TabsTrigger>
            <TabsTrigger value="participants">
              משתתפים ({participantsCount})
            </TabsTrigger>
          </TabsList>

          {/* Volunteers Tab */}
          <TabsContent value="volunteers" className="space-y-4">
            {(!pendingVolunteers || pendingVolunteers.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                אין הרשמות חדשות של מתנדבים
              </p>
            ) : (
              <div className="space-y-4">
                {pendingVolunteers.map((volunteer) => (
                  <div
                    key={volunteer.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
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
                        <span className="text-muted-foreground">זמינות:</span> {volunteer.availability}
                      </div>
                      <div>
                        <span className="text-muted-foreground">שעות:</span> {volunteer.hours}
                      </div>
                      {volunteer.skills.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">כישורים:</span> {volunteer.skills.join(", ")}
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
                        onClick={() =>
                          handleReject("volunteer", volunteer.id, volunteer.name)
                        }
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
            {(!pendingParticipants || pendingParticipants.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                אין הרשמות חדשות של משתתפים
              </p>
            ) : (
              <div className="space-y-4">
                {pendingParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
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
                        <span className="text-muted-foreground">תשלום:</span> {participant.paymentStatus}
                      </div>
                      {participant.email && (
                        <div>
                          <span className="text-muted-foreground">דוא״ל:</span> {participant.email}
                        </div>
                      )}
                      {participant.city && (
                        <div>
                          <span className="text-muted-foreground">עיר:</span> {participant.city}
                        </div>
                      )}
                      {participant.isNewImmigrant && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">עולה חדש/ה, שנת הגעה:</span> {participant.immigrationYear}
                        </div>
                      )}
                      {participant.notes && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">הערות:</span> {participant.notes}
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
                        onClick={() =>
                          handleReject("participant", participant.id, participant.name)
                        }
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
  );
}
