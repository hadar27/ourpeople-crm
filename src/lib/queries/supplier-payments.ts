import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SupplierPayment } from "@/lib/crm-types";

type SupplierPaymentRow = {
  id: string;
  supplier_id: string;
  invoice_id: string;
  amount: number;
  date: string;
  method: string;
};

function toSupplierPayment(row: SupplierPaymentRow): SupplierPayment {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    invoiceId: row.invoice_id,
    amount: row.amount,
    date: row.date,
    method: row.method as SupplierPayment["method"],
  };
}

export const supplierPaymentKeys = {
  all: ["supplierPayments"] as const,
  forSupplier: (supplierId: string | undefined) => [...supplierPaymentKeys.all, "supplier", supplierId] as const,
};

export function useSupplierPaymentsForSupplier(supplierId: string | undefined) {
  return useQuery({
    queryKey: supplierPaymentKeys.forSupplier(supplierId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_payments")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("date");
      if (error) throw error;
      return (data as SupplierPaymentRow[]).map(toSupplierPayment);
    },
    enabled: !!supplierId,
  });
}
