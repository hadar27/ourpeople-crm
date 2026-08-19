import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type GanttPhase = {
  id: string;
  name: string;
  owner: string;
  start: string;
  end: string;
  progress: number;
  dependsOn?: string;
  milestone?: boolean;
};

type ProjectPhaseRow = {
  project_id: string;
  phase_id: string;
  name: string;
  owner: string;
  start_date: string;
  end_date: string;
  progress: number;
  depends_on: string | null;
  milestone: boolean;
};

function toGanttPhase(row: ProjectPhaseRow): GanttPhase {
  return {
    id: row.phase_id,
    name: row.name,
    owner: row.owner,
    start: row.start_date,
    end: row.end_date,
    progress: row.progress,
    dependsOn: row.depends_on ?? undefined,
    milestone: row.milestone,
  };
}

export const projectPhaseKeys = {
  all: ["projectPhases"] as const,
  forProject: (projectId: string | undefined) => [...projectPhaseKeys.all, "project", projectId] as const,
};

export function useProjectPhases(projectId: string | undefined) {
  return useQuery({
    queryKey: projectPhaseKeys.forProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", projectId)
        .order("phase_id");
      if (error) throw error;
      return (data as ProjectPhaseRow[]).map(toGanttPhase);
    },
    enabled: !!projectId,
  });
}
