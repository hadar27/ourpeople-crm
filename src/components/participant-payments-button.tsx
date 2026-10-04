import { RecordEditDialog } from "@/components/record-edit-dialog";
import { useCanEdit } from "@/lib/permissions";
import {
  useUpdateParticipantProjectPayment,
  type ParticipantPayment,
} from "@/lib/queries/participants";
import type { ParticipantPaymentEntry } from "@/lib/participant-payments";

export function ParticipantPaymentsButton({
  participantId,
  name,
  entries,
}: {
  participantId: string;
  name: string;
  entries: ParticipantPaymentEntry[];
}) {
  const allowed = useCanEdit("participants");
  const updatePayment = useUpdateParticipantProjectPayment();
  const paidEntries = entries.filter((entry) => entry.isPaidProject);
  if (!allowed || paidEntries.length === 0) return null;
  return (
    <RecordEditDialog
      triggerLabel="עדכון תשלום"
      title={`תשלומים — ${name}`}
      fields={paidEntries.map((entry) => ({
        name: entry.projectId,
        label: `${entry.projectName} — ₪${entry.amount.toLocaleString()}`,
        type: "select" as const,
        required: true,
        options: ["לא שולם", "שולם חלקית", "שולם"],
      }))}
      initialValues={Object.fromEntries(
        paidEntries.map((entry) => [entry.projectId, entry.paymentStatus]),
      )}
      onSave={async (values) => {
        try {
          for (const entry of paidEntries) {
            if (values[entry.projectId] === entry.paymentStatus) continue;
            await updatePayment.mutateAsync({
              participantId,
              projectId: entry.projectId,
              paymentStatus: values[entry.projectId] as ParticipantPayment,
              agreedPrice: entry.amount,
            });
          }
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            error:
              error && typeof error === "object" && "message" in error
                ? String(error.message)
                : "עדכון התשלום נכשל",
          };
        }
      }}
    />
  );
}
