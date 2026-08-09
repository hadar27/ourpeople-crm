import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type ProjectRecord = {
  id: string;
  name: string;
  status: "פעיל" | "בתכנון" | "הסתיים";
  budget: number;
  spent: number;
  progress: number;
  volunteers: number;
  manager: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  requiredVolunteers?: number;
  suppliers?: string;
  notes?: string;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  progress: number;
  volunteers: number;
  manager: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  required_volunteers: number | null;
  suppliers: string | null;
  notes: string | null;
};

function toProjectRecord(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    status: row.status as ProjectRecord["status"],
    budget: row.budget,
    spent: row.spent,
    progress: row.progress,
    volunteers: row.volunteers,
    manager: row.manager ?? "",
    description: row.description ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    requiredVolunteers: row.required_volunteers ?? undefined,
    suppliers: row.suppliers ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<ProjectRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.budget !== undefined) row.budget = patch.budget;
  if (patch.spent !== undefined) row.spent = patch.spent;
  if (patch.progress !== undefined) row.progress = patch.progress;
  if (patch.volunteers !== undefined) row.volunteers = patch.volunteers;
  if (patch.manager !== undefined) row.manager = patch.manager;
  if (patch.description !== undefined) row.description = patch.description ?? null;
  if (patch.startDate !== undefined) row.start_date = patch.startDate || null;
  if (patch.endDate !== undefined) row.end_date = patch.endDate || null;
  if (patch.requiredVolunteers !== undefined) row.required_volunteers = patch.requiredVolunteers ?? null;
  if (patch.suppliers !== undefined) row.suppliers = patch.suppliers ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (id: string | undefined) => [...projectKeys.all, "detail", id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("name");
      if (error) throw error;
      return (data as ProjectRow[]).map(toProjectRecord);
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? toProjectRecord(data as ProjectRow) : null;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ProjectRecord>) => {
      const { data, error } = await supabase.from("projects").insert(toRow(values)).select().single();
      if (error) throw error;
      return toProjectRecord(data as ProjectRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProjectRecord> }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(toRow(patch))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toProjectRecord(data as ProjectRow);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
}
