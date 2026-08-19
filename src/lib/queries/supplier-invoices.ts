import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type SupplierInvoiceRecord = {
  id: string;
  supplierId: string;
  projectId?: string;
  projectName?: string;
  poId?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: "שולם" | "ממתין" | "חלקי" | "באיחור";
};

type SupplierInvoiceRow = {
  id: string;
  supplier_id: string;
  project_id: string | null;
  po_id: string | null;
  amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  projects: { name: string } | null;
};

function toSupplierInvoiceRecord(row: SupplierInvoiceRow): SupplierInvoiceRecord {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    projectId: row.project_id ?? undefined,
    projectName: row.projects?.name ?? undefined,
    poId: row.po_id ?? undefined,
    amount: row.amount,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: row.status as SupplierInvoiceRecord["status"],
  };
}

const SELECT = "*, projects(name)";

export const supplierInvoiceKeys = {
  all: ["supplierInvoices"] as const,
  forSupplier: (supplierId: string | undefined) => [...supplierInvoiceKeys.all, "supplier", supplierId] as const,
};

export function useSupplierInvoicesForSupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: supplierInvoiceKeys.forSupplier(supplierId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_invoices")
        .select(SELECT)
        .eq("supplier_id", supplierId)
        .order("issue_date");
      if (error) throw error;
      return (data as unknown as SupplierInvoiceRow[]).map(toSupplierInvoiceRecord);
    },
    enabled: !!supplierId,
  });
}
