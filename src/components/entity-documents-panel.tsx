import { useRef } from "react";
import { Download, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, SectionCard } from "@/components/detail-kit";
import {
  downloadEntityDocument,
  useDocumentsForEntity,
  useUploadEntityDocument,
} from "@/lib/queries/documents";
import { useCanEdit, useCurrentUser, type EditableModule } from "@/lib/permissions";
import type { EntityDocument } from "@/lib/crm-types";

type DocumentEntityType = Extract<EntityDocument["entityType"], "participant" | "volunteer">;

export function EntityDocumentsPanel({
  entityType,
  entityId,
}: {
  entityType: DocumentEntityType;
  entityId: string;
}) {
  const module: EditableModule = entityType === "participant" ? "participants" : "volunteers";
  const canUpload = useCanEdit(module);
  const currentUser = useCurrentUser();
  const { data: documents } = useDocumentsForEntity(entityType, entityId);
  const uploadDocument = useUploadEntityDocument();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    try {
      await uploadDocument.mutateAsync({
        entityType,
        entityId,
        file,
        kind: "מסמך",
        uploadedBy: currentUser?.name ?? currentUser?.email ?? "משתמשת מערכת",
      });
      toast.success("המסמך הועלה ונשמר בהצלחה");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "העלאת המסמך נכשלה");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <SectionCard
      title={`מסמכים (${documents?.length ?? 0})`}
      icon={<FileText className="h-4 w-4" />}
      actions={
        canUpload ? (
          <Button
            variant="outline"
            size="sm"
            disabled={uploadDocument.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4 ml-1" />
            {uploadDocument.isPending ? "מעלה..." : "העלאת מסמך"}
          </Button>
        ) : undefined
      }
    >
      {!documents?.length ? (
        <EmptyState text="לא הועלו מסמכים" hint="ניתן להעלות קובצי PDF או תמונות." />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3"
            >
              <FileText className="h-5 w-5 text-brand shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{document.name}</div>
                <div className="text-xs text-muted-foreground">
                  הועלה ב־{document.uploadedAt} על ידי {document.uploadedBy}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await downloadEntityDocument(document);
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "הורדת המסמך נכשלה",
                    );
                  }
                }}
              >
                <Download className="h-4 w-4 ml-1" /> הורדה
              </Button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(event) => handleUpload(event.target.files?.[0])}
      />
    </SectionCard>
  );
}
