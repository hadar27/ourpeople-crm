import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type SupplierRecord = {
  id: string;
  name: string;
  category: string;
  contact: string;
  contracts: number;
  openInvoices: number;
  status: "פעיל" | "מושעה";
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
};

type SupplierRow = {
  id: string;
  name: string;
  category: string;
  contact: string;
  contracts: number;
  open_invoices: number;
  status: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  payment_terms: string | null;
  notes: string | null;
};

function toSupplierRecord(row: SupplierRow): SupplierRecord {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    contact: row.contact,
    contracts: row.contracts,
    openInvoices: row.open_invoices,
    status: row.status as SupplierRecord["status"],
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    taxId: row.tax_id ?? undefined,
    paymentTerms: row.payment_terms ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<SupplierRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.contact !== undefined) row.contact = patch.contact;
  if (patch.contracts !== undefined) row.contracts = patch.contracts;
  if (patch.openInvoices !== undefined) row.open_invoices = patch.openInvoices;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.phone !== undefined) row.phone = patch.phone ?? null;
  if (patch.email !== undefined) row.email = patch.email ?? null;
  if (patch.address !== undefined) row.address = patch.address ?? null;
  if (patch.taxId !== undefined) row.tax_id = patch.taxId ?? null;
  if (patch.paymentTerms !== undefined) row.payment_terms = patch.paymentTerms ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

export const supplierKeys = {
  all: ["suppliers"] as const,
  list: () => [...supplierKeys.all, "list"] as const,
  detail: (id: string | undefined) => [...supplierKeys.all, "detail", id] as const,
};

export function useSuppliers() {
  return useQuery({
    queryKey: supplierKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return (data as SupplierRow[]).map(toSupplierRecord);
    },
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? toSupplierRecord(data as SupplierRow) : null;
    },
    enabled: !!id,
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.list() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<SupplierRecord>) => {
      const { data, error } = await supabase
        .from("suppliers")
        .insert(toRow(values))
        .select()
        .single();
      if (error) throw error;
      return toSupplierRecord(data as SupplierRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.list() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SupplierRecord> }) => {
      const { data, error } = await supabase
        .from("suppliers")
        .update(toRow(patch))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toSupplierRecord(data as SupplierRow);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.list() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) });
    },
  });
}
