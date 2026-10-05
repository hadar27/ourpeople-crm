import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { calculateProjectProgress } from "@/lib/project-progress";

export type ProjectRecord = {
  id: string;
  name: string;
  status: "פעיל" | "בתכנון" | "הסתיים";
  type: "חינמית" | "בתשלום";
  price: number;
  budget: number;
  requestedInitialBudget: number;
  approvalStatus: "ממתין לאישור" | "מאושר" | "נדחה";
  approvedBy?: string;
  approvedAt?: string;
  initialBudget: number;
  approvedAdditions: number;
  releasedAmount: number;
  spent: number;
  progress: number;
  volunteers: number;
  manager: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  requiredVolunteers?: number;
  targetParticipants: number;
  suppliers?: string;
  notes?: string;
  insights?: string;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  type: string;
  price: number;
  budget: number;
  requested_initial_budget: number;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  initial_budget: number;
  approved_additions: number;
  released_amount: number;
  spent: number;
  progress: number;
  volunteers: number;
  manager: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  required_volunteers: number | null;
  target_participants: number;
  suppliers: string | null;
  notes: string | null;
  insights: string | null;
};

function toProjectRecord(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    status: row.status as ProjectRecord["status"],
    type: row.type as ProjectRecord["type"],
    price: row.price,
    budget: row.budget,
    requestedInitialBudget:
      row.requested_initial_budget ?? row.initial_budget ?? row.budget,
    approvalStatus: (row.approval_status ??
      "מאושר") as ProjectRecord["approvalStatus"],
    approvedBy: row.approved_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    initialBudget: row.initial_budget ?? row.budget,
    approvedAdditions: row.approved_additions ?? 0,
    releasedAmount: row.released_amount ?? 0,
    spent: row.spent,
    progress: row.progress,
    volunteers: row.volunteers,
    manager: row.manager ?? "",
    description: row.description ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    requiredVolunteers: row.required_volunteers ?? undefined,
    targetParticipants: row.target_participants ?? 0,
    suppliers: row.suppliers ?? undefined,
    notes: row.notes ?? undefined,
    insights: row.insights ?? undefined,
  };
}

function toRow(patch: Partial<ProjectRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.budget !== undefined) row.budget = patch.budget;
  if (patch.requestedInitialBudget !== undefined)
    row.requested_initial_budget = patch.requestedInitialBudget;
  if (patch.approvalStatus !== undefined)
    row.approval_status = patch.approvalStatus;
  if (patch.spent !== undefined) row.spent = patch.spent;
  if (patch.progress !== undefined) row.progress = patch.progress;
  if (patch.volunteers !== undefined) row.volunteers = patch.volunteers;
  if (patch.manager !== undefined) row.manager = patch.manager;
  if (patch.description !== undefined)
    row.description = patch.description ?? null;
  if (patch.startDate !== undefined) row.start_date = patch.startDate || null;
  if (patch.endDate !== undefined) row.end_date = patch.endDate || null;
  if (patch.requiredVolunteers !== undefined)
    row.required_volunteers = patch.requiredVolunteers ?? null;
  if (patch.targetParticipants !== undefined)
    row.target_participants = patch.targetParticipants;
  if (patch.suppliers !== undefined) row.suppliers = patch.suppliers ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  if (patch.insights !== undefined) row.insights = patch.insights ?? null;
  return row;
}

export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (id: string | undefined) =>
    [...projectKeys.all, "detail", id] as const,
};

type ProjectProgressRow = { project_id: string };
type ProjectTaskProgressRow = ProjectProgressRow & { board_column: string };

async function getProjectProgress(projectId?: string) {
  const projectFilter = <
    T extends { eq: (column: string, value: string) => T },
  >(
    query: T,
  ) => (projectId ? query.eq("project_id", projectId) : query);
  const [
    tasksResult,
    participantsResult,
    directParticipantsResult,
    volunteersResult,
    directVolunteersResult,
  ] = await Promise.all([
    projectFilter(supabase.from("tasks").select("project_id, board_column")),
    projectFilter(
      supabase
        .from("project_participants")
        .select("project_id, participant_id"),
    ),
    projectFilter(supabase.from("participants").select("id, project_id")),
    projectFilter(
      supabase.from("project_volunteers").select("project_id, volunteer_id"),
    ),
    projectFilter(supabase.from("volunteers").select("id, project_id")),
  ]);

  for (const result of [
    tasksResult,
    participantsResult,
    directParticipantsResult,
    volunteersResult,
    directVolunteersResult,
  ]) {
    if (result.error) throw result.error;
  }

  const taskStats = new Map<string, { total: number; done: number }>();
  for (const task of (tasksResult.data ?? []) as ProjectTaskProgressRow[]) {
    const stats = taskStats.get(task.project_id) ?? { total: 0, done: 0 };
    stats.total += 1;
    if (task.board_column === "done") stats.done += 1;
    taskStats.set(task.project_id, stats);
  }
  const participantIds = new Map<string, Set<string>>();
  const volunteerIds = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, project: string, id: string) => {
    const ids = map.get(project) ?? new Set<string>();
    ids.add(id);
    map.set(project, ids);
  };
  for (const row of (participantsResult.data ?? []) as (ProjectProgressRow & {
    participant_id: string;
  })[])
    add(participantIds, row.project_id, row.participant_id);
  for (const row of (directParticipantsResult.data ??
    []) as (ProjectProgressRow & { id: string })[])
    add(participantIds, row.project_id, row.id);
  for (const row of (volunteersResult.data ?? []) as (ProjectProgressRow & {
    volunteer_id: string;
  })[])
    add(volunteerIds, row.project_id, row.volunteer_id);
  for (const row of (directVolunteersResult.data ??
    []) as (ProjectProgressRow & { id: string })[])
    add(volunteerIds, row.project_id, row.id);
  return { taskStats, participantIds, volunteerIds };
}

function applyProgress(
  record: ProjectRecord,
  data: Awaited<ReturnType<typeof getProjectProgress>>,
) {
  const tasks = data.taskStats.get(record.id) ?? { total: 0, done: 0 };
  record.progress = calculateProjectProgress({
    completedTasks: tasks.done,
    totalTasks: tasks.total,
    participants: data.participantIds.get(record.id)?.size ?? 0,
    targetParticipants: record.targetParticipants,
    volunteers: data.volunteerIds.get(record.id)?.size ?? 0,
    requiredVolunteers: record.requiredVolunteers ?? 0,
  });
  record.volunteers = data.volunteerIds.get(record.id)?.size ?? 0;
  return record;
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("name");
      if (error) throw error;

      const [{ data: expenseData, error: expenseError }, progressData] =
        await Promise.all([
          supabase.from("project_expenses").select("project_id, amount"),
          getProjectProgress(),
        ]);
      if (expenseError) throw expenseError;

      const spentByProject = (
        expenseData as { project_id: string; amount: number }[]
      ).reduce(
        (acc, exp) => {
          acc[exp.project_id] = (acc[exp.project_id] ?? 0) + exp.amount;
          return acc;
        },
        {} as Record<string, number>,
      );

      return (data as ProjectRow[]).map((row) => {
        const record = toProjectRecord(row);
        record.spent = spentByProject[record.id] ?? 0;
        return applyProgress(record, progressData);
      });
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;

      if (!data) return null;

      const [{ data: expenseData, error: expenseError }, progressData] =
        await Promise.all([
          supabase
            .from("project_expenses")
            .select("amount")
            .eq("project_id", id),
          getProjectProgress(id),
        ]);
      if (expenseError) throw expenseError;

      const spent = (expenseData as { amount: number }[]).reduce(
        (sum, exp) => sum + exp.amount,
        0,
      );

      const record = toProjectRecord(data as ProjectRow);
      record.spent = spent;
      return applyProgress(record, progressData);
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ProjectRecord>) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(toRow(values))
        .select()
        .single();
      if (error) {
        if (error.message.includes("target_participants"))
          throw new Error(
            "יש להריץ תחילה את קובץ ה-SQL לחישוב התקדמות משוקללת.",
          );
        if (
          error.message.includes("requested_initial_budget") ||
          error.message.includes("approval_status") ||
          error.code === "PGRST204"
        ) {
          throw new Error(
            "יש להריץ תחילה את מיגרציה 0024 ב-Supabase ולאחר מכן לנסות שוב.",
          );
        }
        throw error;
      }
      return toProjectRecord(data as ProjectRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("delete_project_safely", {
        project_value: id,
      });
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ProjectRecord>;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(toRow(patch))
        .eq("id", id)
        .select()
        .single();
      if (error) {
        if (
          error.message.includes("target_participants") ||
          error.code === "PGRST204"
        )
          throw new Error(
            "יש להריץ תחילה את קובץ ה-SQL לחישוב התקדמות משוקללת.",
          );
        throw error;
      }
      return toProjectRecord(data as ProjectRow);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.list() }),
        queryClient.invalidateQueries({
          queryKey: projectKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({ queryKey: ["participants"] }),
      ]);
    },
  });
}
