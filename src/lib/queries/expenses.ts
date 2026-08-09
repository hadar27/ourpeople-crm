import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const GENERAL_PROJECT = "כללי";

export type ExpenseRecord = {
  id: string;
  category: string;
  amount: number;
  date: string;
  supplierId?: string;
  supplier: string;
  projectId?: string;
  project: string;
  status: string;
  receiptStatus?: string;
  reference?: string;
  notes?: string;
};

type ExpenseRow = {
  id: string;
  category: string;
  amount: number;
  date: string;
  supplier_id: string | null;
  project_id: string | null;
  project_label: string | null;
  status: string;
  receipt_status: string | null;
  reference: string | null;
  notes: string | null;
  suppliers: { name: string } | null;
  projects: { name: string } | null;
};

function toExpenseRecord(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    category: row.category,
    amount: row.amount,
    date: row.date,
    supplierId: row.supplier_id ?? undefined,
    supplier: row.suppliers?.name ?? "",
    projectId: row.project_id ?? undefined,
    project: row.projects?.name ?? row.project_label ?? GENERAL_PROJECT,
    status: row.status,
    receiptStatus: row.receipt_status ?? undefined,
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<ExpenseRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.supplier !== undefined) row.supplier_id = patch.supplierId ?? null;
  if (patch.project !== undefined) {
    row.project_label = patch.project;
    row.project_id = patch.projectId ?? null;
  }
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.receiptStatus !== undefined) row.receipt_status = patch.receiptStatus ?? null;
  if (patch.reference !== undefined) row.reference = patch.reference ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

const SELECT = "*, suppliers(name), projects(name)";

export const expenseKeys = {
  all: ["expenses"] as const,
  list: () => [...expenseKeys.all, "list"] as const,
};

export function useExpenses() {
  return useQuery({
    queryKey: expenseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select(SELECT).order("date", { ascending: false });
      if (error) throw error;
      return (data as unknown as ExpenseRow[]).map(toExpenseRecord);
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ExpenseRecord>) => {
      const { data, error } = await supabase.from("expenses").insert(toRow(values)).select(SELECT).single();
      if (error) throw error;
      return toExpenseRecord(data as unknown as ExpenseRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list() });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ExpenseRecord> }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update(toRow(patch))
        .eq("id", id)
        .select(SELECT)
        .single();
      if (error) throw error;
      return toExpenseRecord(data as unknown as ExpenseRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list() });
    },
  });
}
