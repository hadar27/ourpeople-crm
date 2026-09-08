import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { projectKeys } from "@/lib/queries/projects";

export type ProjectExpenseRecord = {
  id: string;
  projectId: string;
  category: string;
  supplierId?: string;
  supplier?: string;
  amount: number;
  date: string;
  status: "שולם" | "ממתין" | "חלקי";
};

type ProjectExpenseRow = {
  id: string;
  project_id: string;
  category: string;
  supplier_id: string | null;
  amount: number;
  date: string;
  status: string;
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
  return row;
}

const SELECT = "*, suppliers(name)";

export const projectExpenseKeys = {
  all: ["projectExpenses"] as const,
  forProject: (projectId: string | undefined) =>
    [...projectExpenseKeys.all, "project", projectId] as const,
};

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
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(record.projectId) });
    },
  });
}
