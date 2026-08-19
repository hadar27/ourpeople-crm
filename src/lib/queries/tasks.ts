import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type TaskRecord = {
  id: string;
  title: string;
  projectId: string;
  project: string;
  assignee: string;
  column: "todo" | "doing" | "done";
};

type TaskRow = {
  id: string;
  title: string;
  project_id: string;
  assignee: string;
  board_column: string;
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
