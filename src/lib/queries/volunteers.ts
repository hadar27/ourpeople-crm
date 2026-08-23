import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type VolunteerRecord = {
  id: string;
  name: string;
  availability: string;
  projectId?: string;
  project: string;
  hours: number;
  status: "פעיל" | "בהפסקה" | "ארכיון";
  skills: string[];
  phone?: string;
  email?: string;
  notes?: string;
};

type VolunteerRow = {
  id: string;
  name: string;
  availability: string;
  project_id: string | null;
  hours: number;
  status: string;
  skills: string[];
  phone: string | null;
  email: string | null;
  notes: string | null;
  projects: { id: string; name: string } | null;
};

function toVolunteerRecord(row: VolunteerRow): VolunteerRecord {
  return {
    id: row.id,
    name: row.name,
    availability: row.availability,
    projectId: row.project_id ?? undefined,
    project: row.projects?.name ?? "",
    hours: row.hours,
    status: row.status as VolunteerRecord["status"],
    skills: row.skills ?? [],
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<VolunteerRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.availability !== undefined) row.availability = patch.availability;
  if (patch.projectId !== undefined) row.project_id = patch.projectId ?? null;
  if (patch.hours !== undefined) row.hours = patch.hours;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.skills !== undefined) row.skills = patch.skills;
  if (patch.phone !== undefined) row.phone = patch.phone ?? null;
  if (patch.email !== undefined) row.email = patch.email ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

const SELECT = "*, projects(id, name)";

export const volunteerKeys = {
  all: ["volunteers"] as const,
  list: () => [...volunteerKeys.all, "list"] as const,
  detail: (id: string | undefined) => [...volunteerKeys.all, "detail", id] as const,
};

export function useVolunteers() {
  return useQuery({
    queryKey: volunteerKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("volunteers").select(SELECT).order("name");
      if (error) throw error;
      return (data as unknown as VolunteerRow[]).map(toVolunteerRecord);
    },
  });
}

export function useVolunteer(id: string | undefined) {
  return useQuery({
    queryKey: volunteerKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteers")
        .select(SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? toVolunteerRecord(data as unknown as VolunteerRow) : null;
    },
    enabled: !!id,
  });
}

export function useDeleteVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("volunteers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: volunteerKeys.list() });
      queryClient.invalidateQueries({ queryKey: volunteerKeys.detail(id) });
    },
  });
}

export function useCreateVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<VolunteerRecord>) => {
      const { data, error } = await supabase
        .from("volunteers")
        .insert(toRow(values))
        .select(SELECT)
        .single();
      if (error) throw error;
      return toVolunteerRecord(data as unknown as VolunteerRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: volunteerKeys.list() });
    },
  });
}

export function useUpdateVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<VolunteerRecord> }) => {
      const { data, error } = await supabase
        .from("volunteers")
        .update(toRow(patch))
        .eq("id", id)
        .select(SELECT)
        .single();
      if (error) throw error;
      return toVolunteerRecord(data as unknown as VolunteerRow);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: volunteerKeys.list() });
      queryClient.invalidateQueries({ queryKey: volunteerKeys.detail(variables.id) });
    },
  });
}
