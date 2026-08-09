import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FollowUpTask, InteractionStatus } from "@/lib/crm-types";

type FollowUpRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  source_interaction_id: string | null;
  title: string;
  due_date: string;
  assignee: string;
  status: string;
};

function toFollowUp(row: FollowUpRow): FollowUpTask {
  return {
    id: row.id,
    entityType: row.entity_type as FollowUpTask["entityType"],
    entityId: row.entity_id,
    entityName: row.entity_name,
    sourceInteractionId: row.source_interaction_id ?? undefined,
    title: row.title,
    dueDate: row.due_date,
    assignee: row.assignee,
    status: row.status as InteractionStatus,
  };
}

function toRow(task: Partial<FollowUpTask>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (task.entityType !== undefined) row.entity_type = task.entityType;
  if (task.entityId !== undefined) row.entity_id = task.entityId;
  if (task.entityName !== undefined) row.entity_name = task.entityName;
  if (task.sourceInteractionId !== undefined) row.source_interaction_id = task.sourceInteractionId ?? null;
  if (task.title !== undefined) row.title = task.title;
  if (task.dueDate !== undefined) row.due_date = task.dueDate;
  if (task.assignee !== undefined) row.assignee = task.assignee;
  if (task.status !== undefined) row.status = task.status;
  return row;
}

export const followUpKeys = {
  all: ["followUps"] as const,
  forEntity: (entityId: string | undefined) => [...followUpKeys.all, "entity", entityId] as const,
};

export function useFollowUpsForEntity(entityId: string | undefined) {
  return useQuery({
    queryKey: followUpKeys.forEntity(entityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("entity_id", entityId)
        .order("due_date");
      if (error) throw error;
      return (data as FollowUpRow[]).map(toFollowUp);
    },
    enabled: !!entityId,
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<FollowUpTask>) => {
      const { data, error } = await supabase.from("follow_ups").insert(toRow(task)).select().single();
      if (error) throw error;
      return toFollowUp(data as FollowUpRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: followUpKeys.forEntity(data.entityId) });
    },
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("follow_ups")
        .update({ status: "הושלם" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toFollowUp(data as FollowUpRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: followUpKeys.forEntity(data.entityId) });
    },
  });
}
