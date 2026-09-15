import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type TaskRecord = {
  id: string;
  title: string;
  projectId: string;
  project: string;
  assignee: string;
  column: "todo" | "doing" | "done";
  startDate?: string;
  endDate?: string;
};

type TaskRow = {
  id: string;
  title: string;
  project_id: string;
  assignee: string;
  board_column: string;
  start_date: string | null;
  end_date: string | null;
  projects: { name: string } | null;
};

function toTaskRecord(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    title: row.title,
    projectId: row.project_id,
    project: row.projects?.name ?? row.project_id,
    assignee: row.assignee,
    column: row.board_column as TaskRecord["column"],
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
  };
}

const SELECT = "*, projects(name)";

export const taskKeys = {
  all: ["tasks"] as const,
  list: () => [...taskKeys.all, "list"] as const,
  forProject: (projectId: string | undefined) => [...taskKeys.all, "project", projectId] as const,
};

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select(SELECT).order("id");
      if (error) throw error;
      return (data as unknown as TaskRow[]).map(toTaskRecord);
    },
  });
}

export function useTasksForProject(projectId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.forProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(SELECT)
        .eq("project_id", projectId)
        .order("id");
      if (error) throw error;
      return (data as unknown as TaskRow[]).map(toTaskRecord);
    },
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<TaskRecord, "id" | "project">) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: values.title,
          project_id: values.projectId,
          assignee: values.assignee,
          board_column: values.column,
          start_date: values.startDate || null,
          end_date: values.endDate || null,
        })
        .select(SELECT)
        .single();
      if (error) throw error;
      return toTaskRecord(data as unknown as TaskRow);
    },
    onSuccess: (_data, values) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list() });
      queryClient.invalidateQueries({ queryKey: taskKeys.forProject(values.projectId) });
    },
  });
}
