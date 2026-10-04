import type {
  ParticipantRecord,
  ParticipantProjectAssignment,
  ParticipantPayment,
} from "@/lib/queries/participants";

export type ParticipantPaymentEntry = {
  projectId: string;
  projectName: string;
  amount: number;
  paymentStatus: ParticipantPayment;
  isPaidProject: boolean;
};

export function getParticipantPayments(
  participant: ParticipantRecord,
  assignments: ParticipantProjectAssignment[],
): ParticipantPaymentEntry[] {
  const linked = assignments.filter(
    (assignment) => assignment.participantId === participant.id,
  );
  const entries = linked.map((assignment) => {
    const isPaidProject = assignment.projectType === "בתשלום";
    return {
      projectId: assignment.id,
      projectName: assignment.name,
      isPaidProject,
      amount: isPaidProject
        ? assignment.agreedPrice && assignment.agreedPrice > 0
          ? assignment.agreedPrice
          : assignment.projectPrice
        : 0,
      paymentStatus: !isPaidProject
        ? ("לא נדרש תשלום" as const)
        : (assignment.paymentStatus ??
          (assignment.id === participant.projectId &&
          participant.paymentStatus !== "לא נדרש תשלום"
            ? participant.paymentStatus
            : ("לא שולם" as const))),
    };
  });
  if (
    participant.projectId &&
    !entries.some((entry) => entry.projectId === participant.projectId)
  ) {
    const isPaidProject = participant.projectType === "בתשלום";
    entries.push({
      projectId: participant.projectId,
      projectName: participant.project,
      isPaidProject,
      amount: isPaidProject ? participant.projectPrice : 0,
      paymentStatus: isPaidProject
        ? participant.paymentStatus === "לא נדרש תשלום"
          ? "לא שולם"
          : participant.paymentStatus
        : "לא נדרש תשלום",
    });
  }
  return entries;
}
