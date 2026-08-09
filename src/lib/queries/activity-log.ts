import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ActivityEntry } from "@/lib/crm-types";

type ActivityLogRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  date: string;
  actor: string;
  action: string;
  detail: string | null;
};

function toActivityEntry(row: ActivityLogRow): ActivityEntry {
  return {
    id: row.id,
    entityType: row.entity_type as ActivityEntry["entityType"],
    entityId: row.entity_id,
    date: row.date,
    actor: row.actor,
    action: row.action,
    detail: row.detail ?? undefined,
  };
}

export const activityLogKeys = {
  all: ["activityLog"] as const,
  forEntity: (entityType: string, entityId: string | undefined) =>
    [...activityLogKeys.all, "entity", entityType, entityId] as const,
};

export function useActivityLogForEntity(entityType: ActivityEntry["entityType"], entityId: string | undefined) {
  return useQuery({
    queryKey: activityLogKeys.forEntity(entityType, entityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as ActivityLogRow[]).map(toActivityEntry);
    },
    enabled: !!entityId,
  });
}
