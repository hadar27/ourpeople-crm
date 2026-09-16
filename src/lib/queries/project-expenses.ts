import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { projectKeys } from "@/lib/queries/projects";

export type ProjectExpenseRecord = {
  id: string;
  projectId: string;
  category: string;
  supplierId?: string | null;
  supplier?: string;
  amount: number;
  date: string;
  status: "שולם" | "ממתין" | "חלקי";
  description?: string;
  reference?: string;
  createdBy?: string;
};

type ProjectExpenseRow = {
  id: string;
  project_id: string;
  category: string;
  supplier_id: string | null;
  amount: number;
  date: string;
  status: string;
  description: string | null;
  reference: string | null;
  created_by: string | null;
  suppliers: { name: string } | null;
};

function toProjectExpenseRecord(row: ProjectExpenseRow): ProjectExpenseRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    category: row.category,
    supplierId: row.supplier_id ?? undefined,
    supplier: row.suppliers?.name ?? undefined,
    amount: row.amount,
    date: row.date,
    status: row.status as ProjectExpenseRecord["status"],
    description: row.description ?? undefined,
    reference: row.reference ?? undefined,
    createdBy: row.created_by ?? undefined,
  };
}

function toRow(patch: Partial<ProjectExpenseRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.projectId !== undefined) row.project_id = patch.projectId;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.supplierId !== undefined) row.supplier_id = patch.supplierId ?? null;
  if (patch.amount !== undefined) row.amount = patch.amount;
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.description !== undefined) row.description = patch.description ?? null;
  if (patch.reference !== undefined) row.reference = patch.reference ?? null;
  if (patch.createdBy !== undefined) row.created_by = patch.createdBy ?? null;
  return row;
}

const SELECT = "*, suppliers(name)";

export const projectExpenseKeys = {
  all: ["projectExpenses"] as const,
  list: () => [...projectExpenseKeys.all, "list"] as const,
  forProject: (projectId: string | undefined) =>
    [...projectExpenseKeys.all, "project", projectId] as const,
};

export function useAllProjectExpenses() {
  return useQuery({
    queryKey: projectExpenseKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_expenses")
        .select(SELECT)
        .order("date", { ascending: false });
      if (error) throw error;
      return (data as unknown as ProjectExpenseRow[]).map(toProjectExpenseRecord);
    },
  });
}

export function useProjectExpenses(projectId: string | undefined) {
  return useQuery({
    queryKey: projectExpenseKeys.forProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_expenses")
        .select(SELECT)
        .eq("project_id", projectId)
        .order("date");
      if (error) throw error;
      return (data as unknown as ProjectExpenseRow[]).map(toProjectExpenseRecord);
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ProjectExpenseRecord>) => {
      const { data, error } = await supabase
        .from("project_expenses")
        .insert(toRow(values))
        .select(SELECT)
        .single();
      if (error) throw error;
      return toProjectExpenseRecord(data as unknown as ProjectExpenseRow);
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: projectExpenseKeys.forProject(record.projectId) });
      queryClient.invalidateQueries({ queryKey: projectExpenseKeys.list() });
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(record.projectId) });
    },
  });
}

export function useDeleteProjectExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: ProjectExpenseRecord) => {
      const { error } = await supabase.from("project_expenses").delete().eq("id", record.id);
      if (error) throw error;
      return record;
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: projectExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(record.projectId) });
    },
  });
}

export function useUpdateProjectExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProjectExpenseRecord> }) => {
      const { data, error } = await supabase
        .from("project_expenses")
        .update(toRow(patch))
        .eq("id", id)
        .select(SELECT)
        .single();
      if (error) throw error;
      return toProjectExpenseRecord(data as unknown as ProjectExpenseRow);
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: projectExpenseKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(record.projectId) });
    },
  });
}
