import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type DonorRecord = {
  id: string;
  name: string;
  type: "פרטי" | "תאגיד" | "קרן";
  totalDonated: number;
  lastDonation: string;
  interests: string[];
  status: "פעיל" | "לא פעיל";
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  preferredChannel?: string;
  notes?: string;
};

type DonorRow = {
  id: string;
  name: string;
  type: string;
  total_donated: number;
  last_donation: string | null;
  interests: string[];
  status: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  preferred_channel: string | null;
  notes: string | null;
};

function toDonorRecord(row: DonorRow): DonorRecord {
  return {
    id: row.id,
    name: row.name,
    type: row.type as DonorRecord["type"],
    totalDonated: row.total_donated,
    lastDonation: row.last_donation ?? "",
    interests: row.interests ?? [],
    status: row.status as DonorRecord["status"],
    contact: row.contact ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    preferredChannel: row.preferred_channel ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<DonorRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.totalDonated !== undefined) row.total_donated = patch.totalDonated;
  if (patch.lastDonation !== undefined) row.last_donation = patch.lastDonation || null;
  if (patch.interests !== undefined) row.interests = patch.interests;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.contact !== undefined) row.contact = patch.contact ?? null;
  if (patch.phone !== undefined) row.phone = patch.phone ?? null;
  if (patch.email !== undefined) row.email = patch.email ?? null;
  if (patch.address !== undefined) row.address = patch.address ?? null;
  if (patch.preferredChannel !== undefined) row.preferred_channel = patch.preferredChannel ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

export const donorKeys = {
  all: ["donors"] as const,
  list: () => [...donorKeys.all, "list"] as const,
  detail: (id: string | undefined) => [...donorKeys.all, "detail", id] as const,
};

export function useDonors() {
  return useQuery({
    queryKey: donorKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("donors").select("*").order("name");
      if (error) throw error;
      return (data as DonorRow[]).map(toDonorRecord);
    },
  });
}

export function useDonor(id: string | undefined) {
  return useQuery({
    queryKey: donorKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("donors").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? toDonorRecord(data as DonorRow) : null;
    },
    enabled: !!id,
  });
}

export function useCreateDonor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<DonorRecord>) => {
      const { data, error } = await supabase.from("donors").insert(toRow(values)).select().single();
      if (error) throw error;
      return toDonorRecord(data as DonorRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: donorKeys.list() });
    },
  });
}

export function useDeleteDonor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("donors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: donorKeys.list() });
      queryClient.invalidateQueries({ queryKey: donorKeys.detail(id) });
    },
  });
}

export function useUpdateDonor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<DonorRecord> }) => {
      const { data, error } = await supabase
        .from("donors")
        .update(toRow(patch))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toDonorRecord(data as DonorRow);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: donorKeys.list() });
      queryClient.invalidateQueries({ queryKey: donorKeys.detail(variables.id) });
    },
  });
}
