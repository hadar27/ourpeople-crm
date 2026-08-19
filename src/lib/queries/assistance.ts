import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AssistanceNeed, AssistanceRecord } from "@/lib/crm-types";

type AssistanceRow = {
  id: string;
  family_id: string;
  type: string;
  description: string;
  amount: number | null;
  date: string;
  project_id: string | null;
  staff: string;
  status: string;
};

function toAssistanceRecord(row: AssistanceRow): AssistanceRecord {
  return {
    id: row.id,
    familyId: row.family_id,
    type: row.type as AssistanceNeed,
    description: row.description,
    amount: row.amount ?? undefined,
    date: row.date,
    projectId: row.project_id ?? undefined,
    staff: row.staff,
    status: row.status as AssistanceRecord["status"],
  };
}

function toRow(patch: Partial<AssistanceRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.familyId !== undefined) row.family_id = patch.familyId;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.amount !== undefined) row.amount = patch.amount ?? null;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.projectId !== undefined) row.project_id = patch.projectId ?? null;
  if (patch.staff !== undefined) row.staff = patch.staff;
  if (patch.status !== undefined) row.status = patch.status;
  return row;
}

export const assistanceKeys = {
  all: ["assistance"] as const,
  list: () => [...assistanceKeys.all, "list"] as const,
  forFamily: (familyId: string | undefined) => [...assistanceKeys.all, "family", familyId] as const,
};

/** All assistance records (used for the families list page's aggregate KPI). */
export function useAllAssistance() {
  return useQuery({
    queryKey: assistanceKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("assistance").select("*");
      if (error) throw error;
      return (data as AssistanceRow[]).map(toAssistanceRecord);
    },
  });
}

export function useAssistanceForFamily(familyId: string | undefined) {
  return useQuery({
    queryKey: assistanceKeys.forFamily(familyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assistance")
        .select("*")
        .eq("family_id", familyId)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as AssistanceRow[]).map(toAssistanceRecord);
    },
    enabled: !!familyId,
  });
}

export function useCreateAssistance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<AssistanceRecord>) => {
      const { data, error } = await supabase.from("assistance").insert(toRow(values)).select().single();
      if (error) throw error;
      return toAssistanceRecord(data as AssistanceRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assistanceKeys.forFamily(data.familyId) });
      queryClient.invalidateQueries({ queryKey: assistanceKeys.list() });
    },
  });
}

export function useSetAssistanceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AssistanceRecord["status"] }) => {
      const { data, error } = await supabase
        .from("assistance")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toAssistanceRecord(data as AssistanceRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assistanceKeys.forFamily(data.familyId) });
      queryClient.invalidateQueries({ queryKey: assistanceKeys.list() });
    },
  });
}
