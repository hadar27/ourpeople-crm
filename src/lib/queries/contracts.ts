import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type ContractRecord = {
  id: string;
  supplierId: string;
  title: string;
  projectId?: string;
  projectName?: string;
  value: number;
  startDate: string;
  endDate: string;
  status: "בתוקף" | "הסתיים" | "בטיוטה";
};

type ContractRow = {
  id: string;
  supplier_id: string;
  title: string;
  project_id: string | null;
  value: number;
  start_date: string;
  end_date: string;
  status: string;
  projects: { name: string } | null;
};

function toContractRecord(row: ContractRow): ContractRecord {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    title: row.title,
    projectId: row.project_id ?? undefined,
    projectName: row.projects?.name ?? undefined,
    value: row.value,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as ContractRecord["status"],
  };
}

const SELECT = "*, projects(name)";

export const contractKeys = {
  all: ["contracts"] as const,
  forSupplier: (supplierId: string | undefined) => [...contractKeys.all, "supplier", supplierId] as const,
};

export function useContractsForSupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: contractKeys.forSupplier(supplierId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(SELECT)
        .eq("supplier_id", supplierId)
        .order("start_date");
      if (error) throw error;
      return (data as unknown as ContractRow[]).map(toContractRecord);
    },
    enabled: !!supplierId,
  });
}
