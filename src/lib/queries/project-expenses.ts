import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

const SELECT = "*, suppliers(name)";

export const projectExpenseKeys = {
  all: ["projectExpenses"] as const,
  forProject: (projectId: string | undefined) => [...projectExpenseKeys.all, "project", projectId] as const,
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
