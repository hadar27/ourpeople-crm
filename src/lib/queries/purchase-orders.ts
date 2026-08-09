import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type PurchaseOrderRecord = {
  id: string;
  supplierId: string;
  projectId?: string;
  projectName?: string;
  description: string;
  amount: number;
  date: string;
  status: "מאושרת" | "ממתין" | "בוטלה";
};

type PurchaseOrderRow = {
  id: string;
  supplier_id: string;
  project_id: string | null;
  description: string;
  amount: number;
  date: string;
  status: string;
  projects: { name: string } | null;
};

function toPurchaseOrderRecord(row: PurchaseOrderRow): PurchaseOrderRecord {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    projectId: row.project_id ?? undefined,
    projectName: row.projects?.name ?? undefined,
    description: row.description,
    amount: row.amount,
    date: row.date,
    status: row.status as PurchaseOrderRecord["status"],
  };
}

const SELECT = "*, projects(name)";

export const purchaseOrderKeys = {
  all: ["purchaseOrders"] as const,
  forSupplier: (supplierId: string | undefined) => [...purchaseOrderKeys.all, "supplier", supplierId] as const,
};

export function usePurchaseOrdersForSupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: purchaseOrderKeys.forSupplier(supplierId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(SELECT)
        .eq("supplier_id", supplierId)
        .order("date");
      if (error) throw error;
      return (data as unknown as PurchaseOrderRow[]).map(toPurchaseOrderRecord);
    },
    enabled: !!supplierId,
  });
}
