import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FamilyMember } from "@/lib/crm-types";

type FamilyMemberRow = {
  id: string;
  family_id: string;
  name: string;
  relation: string;
  birth_year: number;
  status: string;
  notes: string | null;
};

function toFamilyMember(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    relation: row.relation as FamilyMember["relation"],
    birthYear: row.birth_year,
    status: row.status as FamilyMember["status"],
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<FamilyMember>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.familyId !== undefined) row.family_id = patch.familyId;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.relation !== undefined) row.relation = patch.relation;
  if (patch.birthYear !== undefined) row.birth_year = patch.birthYear;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

export const familyMemberKeys = {
  all: ["familyMembers"] as const,
  forFamily: (familyId: string | undefined) => [...familyMemberKeys.all, "family", familyId] as const,
};

export function useFamilyMembers(familyId: string | undefined) {
  return useQuery({
    queryKey: familyMemberKeys.forFamily(familyId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .eq("family_id", familyId)
        .order("id");
      if (error) throw error;
      return (data as FamilyMemberRow[]).map(toFamilyMember);
    },
    enabled: !!familyId,
  });
}

export function useCreateFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<FamilyMember>) => {
      const { data, error } = await supabase.from("family_members").insert(toRow(values)).select().single();
      if (error) throw error;
      return toFamilyMember(data as FamilyMemberRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: familyMemberKeys.forFamily(data.familyId) });
    },
  });
}
