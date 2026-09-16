import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { EntityDocument } from "@/lib/crm-types";

type DocumentRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  name: string;
  kind: string;
  uploaded_at: string;
  uploaded_by: string;
  storage_path: string | null;
};

function toDocument(row: DocumentRow): EntityDocument {
  return {
    id: row.id,
    entityType: row.entity_type as EntityDocument["entityType"],
    entityId: row.entity_id,
    name: row.name,
    kind: row.kind,
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    storagePath: row.storage_path ?? undefined,
  };
}

export function useUploadEntityDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      file,
      kind = "קבלה",
      uploadedBy = "משתמשת מערכת",
    }: {
      entityType: EntityDocument["entityType"];
      entityId: string;
      file: File;
      kind?: string;
      uploadedBy?: string;
    }) => {
      const fileId = crypto.randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storagePath = `${entityType}/${entityId}/${fileId}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, { contentType: file.type || undefined });
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("documents")
        .insert({
          id: `DOC-${fileId}`,
          entity_type: entityType,
          entity_id: entityId,
          name: file.name,
          kind,
          uploaded_at: new Date().toISOString().slice(0, 10),
          uploaded_by: uploadedBy,
          storage_path: storagePath,
        })
        .select("*")
        .single();
      if (error) {
        await supabase.storage.from("documents").remove([storagePath]);
        throw error;
      }
      return toDocument(data as DocumentRow);
    },
    onSuccess: (document) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.forEntity(document.entityType, document.entityId),
      });
    },
  });
}

export async function downloadEntityDocument(document: EntityDocument) {
  if (!document.storagePath) {
    if (document.kind === "הצעת מחיר") {
      const link = window.document.createElement("a");
      link.href = "/documents/quotation-equipment-q2.html";
      link.download = "quotation-equipment-q2.html";
      link.click();
      return;
    }
    throw new Error("לקובץ הישן אין קובץ מצורף");
  }

  const { data, error } = await supabase.storage.from("documents").download(document.storagePath);
  if (error) throw error;
  const url = URL.createObjectURL(data);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = document.name;
  link.click();
  URL.revokeObjectURL(url);
}

export const documentKeys = {
  all: ["documents"] as const,
  forEntity: (entityType: string, entityId: string | undefined) =>
    [...documentKeys.all, "entity", entityType, entityId] as const,
};

export function useDocumentsForEntity(
  entityType: EntityDocument["entityType"],
  entityId: string | undefined,
) {
  return useQuery({
    queryKey: documentKeys.forEntity(entityType, entityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return (data as DocumentRow[]).map(toDocument);
    },
    enabled: !!entityId,
  });
}
