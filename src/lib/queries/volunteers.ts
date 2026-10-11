import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type VolunteerRecord = {
  id: string;
  idNumber?: string;
  name: string;
  availability: string;
  projectId?: string;
  project: string;
  projects: VolunteerProject[];
  status: "פעיל" | "בהפסקה" | "ארכיון";
  skills: string[];
  phone?: string;
  email?: string;
  notes?: string;
  createdAt?: string;
};

export type VolunteerProject = {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status: string;
};

export type ProjectVolunteerAssignment = {
  projectId: string;
  volunteerId: string;
};

type VolunteerRow = {
  id: string;
  id_number: string | null;
  name: string;
  availability: string;
  project_id: string | null;
  status: string;
  skills: string[];
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  projects: { id: string; name: string } | null;
};

type ProjectAssignmentRow = {
  volunteer_id: string;
  projects:
    | {
        id: string;
        name: string;
        start_date: string | null;
        end_date: string | null;
        status: string;
      }
    | {
        id: string;
        name: string;
        start_date: string | null;
        end_date: string | null;
        status: string;
      }[]
    | null;
};

function assignmentProject(row: ProjectAssignmentRow): VolunteerProject | null {
  const value = Array.isArray(row.projects) ? row.projects[0] : row.projects;
  return value
    ? {
        id: value.id,
        name: value.name,
        startDate: value.start_date ?? undefined,
        endDate: value.end_date ?? undefined,
        status: value.status,
      }
    : null;
}

function toVolunteerRecord(
  row: VolunteerRow,
  assignedProjects: VolunteerProject[] = [],
): VolunteerRecord {
  const legacyProject = row.projects
    ? { id: row.projects.id, name: row.projects.name, status: "" }
    : null;
  const projects = [...assignedProjects];
  if (
    legacyProject &&
    !projects.some((project) => project.id === legacyProject.id)
  )
    projects.push(legacyProject);
  return {
    id: row.id,
    idNumber: row.id_number ?? undefined,
    name: row.name,
    availability: row.availability,
    projectId: row.project_id ?? undefined,
    project: projects.map((project) => project.name).join(", "),
    projects,
    status: row.status as VolunteerRecord["status"],
    skills: row.skills ?? [],
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function toRow(patch: Partial<VolunteerRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.idNumber !== undefined) row.id_number = patch.idNumber ?? null;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.availability !== undefined) row.availability = patch.availability;
  if (patch.projectId !== undefined) row.project_id = patch.projectId ?? null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.skills !== undefined) row.skills = patch.skills;
  if (patch.phone !== undefined) row.phone = patch.phone ?? null;
  if (patch.email !== undefined) row.email = patch.email ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

const SELECT =
  "id, id_number, name, availability, project_id, status, skills, phone, email, notes, created_at, projects(id, name)";

export const volunteerKeys = {
  all: ["volunteers"] as const,
  list: () => [...volunteerKeys.all, "list"] as const,
  detail: (id: string | undefined) =>
    [...volunteerKeys.all, "detail", id] as const,
  forProject: (projectId: string | undefined) =>
    [...volunteerKeys.all, "project", projectId] as const,
  assignments: () => [...volunteerKeys.all, "assignments"] as const,
};

async function loadAssignedProjects(volunteerId?: string) {
  let query = supabase
    .from("project_volunteers")
    .select("volunteer_id, projects(id, name, start_date, end_date, status)");
  if (volunteerId) query = query.eq("volunteer_id", volunteerId);
  const { data, error } = await query;
  if (error) throw error;
  const projectsByVolunteer = new Map<string, VolunteerProject[]>();
  for (const row of data as unknown as ProjectAssignmentRow[]) {
    const project = assignmentProject(row);
    if (!project) continue;
    const current = projectsByVolunteer.get(row.volunteer_id) ?? [];
    current.push(project);
    projectsByVolunteer.set(row.volunteer_id, current);
  }
  return projectsByVolunteer;
}

export function useVolunteers() {
  return useQuery({
    queryKey: volunteerKeys.list(),
    queryFn: async () => {
      const [{ data, error }, projectsByVolunteer] = await Promise.all([
        supabase.from("volunteers").select(SELECT).order("name"),
        loadAssignedProjects(),
      ]);
      if (error) throw error;
      return (data as unknown as VolunteerRow[]).map((row) =>
        toVolunteerRecord(row, projectsByVolunteer.get(row.id) ?? []),
      );
    },
  });
}

export function useProjectVolunteerIds(projectId: string | undefined) {
  return useQuery({
    queryKey: volunteerKeys.forProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_volunteers")
        .select("volunteer_id")
        .eq("project_id", projectId);
      if (error) throw error;
      return (data as { volunteer_id: string }[]).map(
        (row) => row.volunteer_id,
      );
    },
    enabled: !!projectId,
  });
}

export function useAllProjectVolunteerAssignments() {
  return useQuery({
    queryKey: volunteerKeys.assignments(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_volunteers")
        .select("project_id, volunteer_id");
      if (error) throw error;
      return (data as { project_id: string; volunteer_id: string }[]).map(
        (row) => ({
          projectId: row.project_id,
          volunteerId: row.volunteer_id,
        }),
      );
    },
  });
}

export function useAssignVolunteerToProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      volunteerId,
    }: {
      projectId: string;
      volunteerId: string;
    }) => {
      const { error } = await supabase
        .from("project_volunteers")
        .insert({ project_id: projectId, volunteer_id: volunteerId });
      if (error) throw error;
    },
    onSuccess: (_data, values) => {
      queryClient.invalidateQueries({
        queryKey: volunteerKeys.forProject(values.projectId),
      });
      queryClient.invalidateQueries({ queryKey: volunteerKeys.list() });
      queryClient.invalidateQueries({
        queryKey: volunteerKeys.detail(values.volunteerId),
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useVolunteer(id: string | undefined) {
  return useQuery({
    queryKey: volunteerKeys.detail(id),
    queryFn: async () => {
      const [{ data, error }, projectsByVolunteer] = await Promise.all([
        supabase.from("volunteers").select(SELECT).eq("id", id).maybeSingle(),
        loadAssignedProjects(id),
      ]);
      if (error) throw error;
      return data
        ? toVolunteerRecord(
            data as unknown as VolunteerRow,
            projectsByVolunteer.get(id!) ?? [],
          )
        : null;
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<VolunteerRecord>;
    }) => {
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
      queryClient.invalidateQueries({
        queryKey: volunteerKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
