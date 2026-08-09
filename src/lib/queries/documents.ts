import { useQuery } from "@tanstack/react-query";
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
  };
}

export const documentKeys = {
  all: ["documents"] as const,
  forEntity: (entityType: string, entityId: string | undefined) =>
    [...documentKeys.all, "entity", entityType, entityId] as const,
};

export function useDocumentsForEntity(entityType: EntityDocument["entityType"], entityId: string | undefined) {
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
