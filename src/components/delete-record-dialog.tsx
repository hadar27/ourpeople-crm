// Generic delete-confirmation button. Each entity's *DeleteButton (in
// module-edit-dialogs.tsx) wraps this with its own title/description and
// delete mutation.
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function toFriendlyError(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: unknown }).code === "23503"
  ) {
    return "לא ניתן למחוק — קיימות רשומות משויכות במערכת (למשל תרומות, חשבוניות או הקצאות).";
  }
  return err instanceof Error ? err.message : "מחיקת הרשומה נכשלה. נסו שוב.";
}

interface DeleteRecordButtonProps {
  title: string;
  description: string;
  onDelete: () => Promise<void>;
  triggerLabel?: string;
  successMessage?: string;
}

export function DeleteRecordButton({
  title,
  description,
  onDelete,
  triggerLabel = "מחיקה",
  successMessage = "הרשומה נמחקה בהצלחה",
}: DeleteRecordButtonProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      toast.success(successMessage);
      setOpen(false);
    } catch (err) {
      const message = toFriendlyError(err);
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!deleting) {
          setOpen(next);
          if (next) setError(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border-destructive/30 text-destructive hover:bg-destructive/5"
        >
          <Trash2 className="h-3.5 w-3.5" /> {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="text-right">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
            {error}
          </div>
        )}
        <AlertDialogFooter className="flex-row-reverse gap-2 sm:gap-2">
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleting}
            className="min-w-28"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" /> מוחק...
              </>
            ) : (
              "מחיקה"
            )}
          </Button>
          <AlertDialogCancel disabled={deleting}>ביטול</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
