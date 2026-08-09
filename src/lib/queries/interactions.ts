import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DonorInteraction, InteractionStatus, InteractionType } from "@/lib/crm-types";

type InteractionRow = {
  id: string;
  donor_id: string;
  type: string;
  date: string;
  time: string;
  staff: string;
  subject: string;
  summary: string;
  outcome: string;
  follow_up_action: string | null;
  follow_up_date: string | null;
  status: string;
  created_at: string;
};

function toInteraction(row: InteractionRow): DonorInteraction {
  return {
    id: row.id,
    donorId: row.donor_id,
    type: row.type as InteractionType,
    date: row.date,
    time: row.time,
    staff: row.staff,
    subject: row.subject,
    summary: row.summary,
    outcome: row.outcome,
    followUpAction: row.follow_up_action ?? undefined,
    followUpDate: row.follow_up_date ?? undefined,
    status: row.status as InteractionStatus,
    createdAt: row.created_at,
  };
}

function toRow(patch: Partial<DonorInteraction>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.donorId !== undefined) row.donor_id = patch.donorId;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.time !== undefined) row.time = patch.time;
  if (patch.staff !== undefined) row.staff = patch.staff;
  if (patch.subject !== undefined) row.subject = patch.subject;
  if (patch.summary !== undefined) row.summary = patch.summary;
  if (patch.outcome !== undefined) row.outcome = patch.outcome;
  if (patch.followUpAction !== undefined) row.follow_up_action = patch.followUpAction ?? null;
  if (patch.followUpDate !== undefined) row.follow_up_date = patch.followUpDate ?? null;
  if (patch.status !== undefined) row.status = patch.status;
  return row;
}

export const interactionKeys = {
  all: ["interactions"] as const,
  forDonor: (donorId: string | undefined) => [...interactionKeys.all, "donor", donorId] as const,
};

export function useInteractionsForDonor(donorId: string | undefined) {
  return useQuery({
    queryKey: interactionKeys.forDonor(donorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("donor_id", donorId)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as InteractionRow[]).map(toInteraction);
    },
    enabled: !!donorId,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<DonorInteraction>) => {
      const { data, error } = await supabase.from("interactions").insert(toRow(values)).select().single();
      if (error) throw error;
      return toInteraction(data as InteractionRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: interactionKeys.forDonor(data.donorId) });
    },
  });
}

export function useUpdateInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<DonorInteraction> }) => {
      const { data, error } = await supabase
        .from("interactions")
        .update(toRow(patch))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toInteraction(data as InteractionRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: interactionKeys.forDonor(data.donorId) });
    },
  });
}

export function useSetInteractionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InteractionStatus }) => {
      const { data, error } = await supabase
        .from("interactions")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toInteraction(data as InteractionRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: interactionKeys.forDonor(data.donorId) });
    },
  });
}
