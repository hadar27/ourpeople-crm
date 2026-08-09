import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const ANONYMOUS_DONOR = "תרומה אנונימית";

export type DonationRecord = {
  id: string;
  donorId?: string;
  isAnonymous: boolean;
  donor: string;
  amount: number;
  projectId?: string;
  activityId?: string;
  project: string;
  method: "העברה בנקאית" | "אשראי" | "מזומן" | "שיק";
  receipt: "הופק" | "ממתין" | "חסר";
  date: string;
  reference?: string;
  notes?: string;
};

type DonationRow = {
  id: string;
  donor_id: string | null;
  is_anonymous: boolean;
  amount: number;
  project_id: string | null;
  activity_id: string | null;
  project_label: string | null;
  method: string;
  receipt: string;
  date: string;
  reference: string | null;
  notes: string | null;
  donors: { name: string } | null;
  projects: { name: string } | null;
  activities: { name: string } | null;
};

function toDonationRecord(row: DonationRow): DonationRecord {
  return {
    id: row.id,
    donorId: row.donor_id ?? undefined,
    isAnonymous: row.is_anonymous,
    donor: row.donors?.name ?? (row.is_anonymous ? ANONYMOUS_DONOR : ""),
    amount: row.amount,
    projectId: row.project_id ?? undefined,
    activityId: row.activity_id ?? undefined,
    project: row.projects?.name ?? row.activities?.name ?? row.project_label ?? "",
    method: row.method as DonationRecord["method"],
    receipt: row.receipt as DonationRecord["receipt"],
    date: row.date,
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<DonationRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.isAnonymous !== undefined) row.is_anonymous = patch.isAnonymous;
  if (patch.donorId !== undefined || patch.isAnonymous !== undefined) {
    row.donor_id = patch.isAnonymous ? null : patch.donorId ?? null;
  }
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.project !== undefined) {
    row.project_label = patch.project;
    row.project_id = patch.projectId ?? null;
    row.activity_id = patch.activityId ?? null;
  }
  if (patch.method !== undefined) row.method = patch.method;
  if (patch.receipt !== undefined) row.receipt = patch.receipt;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.reference !== undefined) row.reference = patch.reference ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

const SELECT = "*, donors(name), projects(name), activities(name)";

export const donationKeys = {
  all: ["donations"] as const,
  list: () => [...donationKeys.all, "list"] as const,
  detail: (id: string | undefined) => [...donationKeys.all, "detail", id] as const,
};

export function useDonations() {
  return useQuery({
    queryKey: donationKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select(SELECT).order("date", { ascending: false });
      if (error) throw error;
      return (data as unknown as DonationRow[]).map(toDonationRecord);
    },
  });
}

export function useDonation(id: string | undefined) {
  return useQuery({
    queryKey: donationKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select(SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? toDonationRecord(data as unknown as DonationRow) : null;
    },
    enabled: !!id,
  });
}

export function useCreateDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<DonationRecord>) => {
      const { data, error } = await supabase
        .from("donations")
        .insert(toRow(values))
        .select(SELECT)
        .single();
      if (error) throw error;
      return toDonationRecord(data as unknown as DonationRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: donationKeys.list() });
    },
  });
}

export function useUpdateDonation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<DonationRecord> }) => {
      const { data, error } = await supabase
        .from("donations")
        .update(toRow(patch))
        .eq("id", id)
        .select(SELECT)
        .single();
      if (error) throw error;
      return toDonationRecord(data as unknown as DonationRow);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: donationKeys.list() });
      queryClient.invalidateQueries({ queryKey: donationKeys.detail(variables.id) });
    },
  });
}
