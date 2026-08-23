import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { AssistanceNeed, FamilyStatus } from "@/lib/crm-types";

export type FamilyRecord = {
  id: string;
  familyName: string;
  mainContact: string;
  phone: string;
  email?: string;
  city: string;
  countryOfOrigin: string;
  immigrationDate: string;
  membersCount: number;
  needs: AssistanceNeed[];
  status: FamilyStatus;
  assignedStaff: string;
  projectId?: string;
  notes?: string;
};

type FamilyRow = {
  id: string;
  family_name: string;
  main_contact: string;
  phone: string;
  email: string | null;
  city: string;
  country_of_origin: string;
  immigration_date: string;
  members_count: number;
  needs: string[];
  status: string;
  assigned_staff: string;
  project_id: string | null;
  notes: string | null;
};

function toFamilyRecord(row: FamilyRow): FamilyRecord {
  return {
    id: row.id,
    familyName: row.family_name,
    mainContact: row.main_contact,
    phone: row.phone,
    email: row.email ?? undefined,
    city: row.city,
    countryOfOrigin: row.country_of_origin,
    immigrationDate: row.immigration_date,
    membersCount: row.members_count,
    needs: (row.needs ?? []) as AssistanceNeed[],
    status: row.status as FamilyStatus,
    assignedStaff: row.assigned_staff,
    projectId: row.project_id ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<FamilyRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.familyName !== undefined) row.family_name = patch.familyName;
  if (patch.mainContact !== undefined) row.main_contact = patch.mainContact;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.email !== undefined) row.email = patch.email ?? null;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.countryOfOrigin !== undefined) row.country_of_origin = patch.countryOfOrigin;
  if (patch.immigrationDate !== undefined) row.immigration_date = patch.immigrationDate;
  if (patch.membersCount !== undefined) row.members_count = patch.membersCount;
  if (patch.needs !== undefined) row.needs = patch.needs;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.assignedStaff !== undefined) row.assigned_staff = patch.assignedStaff;
  if (patch.projectId !== undefined) row.project_id = patch.projectId ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

export const familyKeys = {
  all: ["families"] as const,
  list: () => [...familyKeys.all, "list"] as const,
  detail: (id: string | undefined) => [...familyKeys.all, "detail", id] as const,
};

export function useFamilies() {
  return useQuery({
    queryKey: familyKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("families").select("*").order("family_name");
      if (error) throw error;
      return (data as FamilyRow[]).map(toFamilyRecord);
    },
  });
}

export function useFamily(id: string | undefined) {
  return useQuery({
    queryKey: familyKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("families")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? toFamilyRecord(data as FamilyRow) : null;
    },
    enabled: !!id,
  });
}

export function useDeleteFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("families").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.list() });
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(id) });
    },
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<FamilyRecord>) => {
      const { data, error } = await supabase
        .from("families")
        .insert(toRow(values))
        .select()
        .single();
      if (error) throw error;
      return toFamilyRecord(data as FamilyRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.list() });
    },
  });
}

export function useUpdateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<FamilyRecord> }) => {
      const { data, error } = await supabase
        .from("families")
        .update(toRow(patch))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toFamilyRecord(data as FamilyRow);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.list() });
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(variables.id) });
    },
  });
}
