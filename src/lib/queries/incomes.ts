import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const GENERAL_PROJECT = "כללי";

export type IncomeRecord = {
  id: string;
  category: string;
  source: string;
  amount: number;
  date: string;
  donationId?: string;
  projectId?: string;
  project: string;
  method?: string;
  reference?: string;
  notes?: string;
};

type IncomeRow = {
  id: string;
  category: string;
  source: string;
  amount: number;
  date: string;
  donation_id: string | null;
  project_id: string | null;
  project_label: string | null;
  method: string | null;
  reference: string | null;
  notes: string | null;
  projects: { name: string } | null;
};

function toIncomeRecord(row: IncomeRow): IncomeRecord {
  return {
    id: row.id,
    category: row.category,
    source: row.source,
    amount: row.amount,
    date: row.date,
    donationId: row.donation_id ?? undefined,
    projectId: row.project_id ?? undefined,
    project: row.projects?.name ?? row.project_label ?? GENERAL_PROJECT,
    method: row.method ?? undefined,
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<IncomeRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.source !== undefined) row.source = patch.source;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.donationId !== undefined) row.donation_id = patch.donationId ?? null;
  if (patch.project !== undefined) {
    row.project_label = patch.project;
    row.project_id = patch.projectId ?? null;
  }
  if (patch.method !== undefined) row.method = patch.method ?? null;
  if (patch.reference !== undefined) row.reference = patch.reference ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

const SELECT = "*, projects(name)";

export const incomeKeys = {
  all: ["incomes"] as const,
  list: () => [...incomeKeys.all, "list"] as const,
};

export function useIncomes() {
  return useQuery({
    queryKey: incomeKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomes")
        .select(SELECT)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as unknown as IncomeRow[]).map(toIncomeRecord);
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("incomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.list() });
    },
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<IncomeRecord>) => {
      const { data, error } = await supabase
        .from("incomes")
        .insert(toRow(values))
        .select(SELECT)
        .single();
      if (error) throw error;
      return toIncomeRecord(data as unknown as IncomeRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.list() });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<IncomeRecord> }) => {
      const { data, error } = await supabase
        .from("incomes")
        .update(toRow(patch))
        .eq("id", id)
        .select(SELECT)
        .single();
      if (error) throw error;
      return toIncomeRecord(data as unknown as IncomeRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incomeKeys.list() });
    },
  });
}
