import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DonationAllocation } from "@/lib/crm-types";

type AllocationRow = {
  id: string;
  donation_id: string;
  project_id: string;
  amount: number;
  date: string;
  notes: string | null;
};

function toAllocation(row: AllocationRow): DonationAllocation {
  return {
    id: row.id,
    donationId: row.donation_id,
    projectId: row.project_id,
    amount: row.amount,
    date: row.date,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<DonationAllocation>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.donationId !== undefined) row.donation_id = patch.donationId;
  if (patch.projectId !== undefined) row.project_id = patch.projectId;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

export const allocationKeys = {
  all: ["allocations"] as const,
  forDonation: (donationId: string | undefined) => [...allocationKeys.all, "donation", donationId] as const,
};

export function useAllocationsForDonation(donationId: string | undefined) {
  return useQuery({
    queryKey: allocationKeys.forDonation(donationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allocations")
        .select("*")
        .eq("donation_id", donationId)
        .order("date");
      if (error) throw error;
      return (data as AllocationRow[]).map(toAllocation);
    },
    enabled: !!donationId,
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<DonationAllocation>) => {
      const { data, error } = await supabase.from("allocations").insert(toRow(values)).select().single();
      if (error) throw error;
      return toAllocation(data as AllocationRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.forDonation(data.donationId) });
    },
  });
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; donationId: string }) => {
      const { error } = await supabase.from("allocations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: allocationKeys.forDonation(variables.donationId) });
    },
  });
}
