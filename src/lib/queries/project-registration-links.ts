import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type RegistrationLinkRecord = {
  id: string;
  projectId: string;
  linkType: "volunteer" | "participant";
  linkToken: string;
  createdAt: string;
  fullUrl?: string;
};

type RegistrationLinkRow = {
  id: string;
  project_id: string;
  link_type: string;
  link_token: string;
  created_at: string;
};

function toRegistrationLinkRecord(row: RegistrationLinkRow, baseUrl?: string): RegistrationLinkRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    linkType: row.link_type as "volunteer" | "participant",
    linkToken: row.link_token,
    createdAt: row.created_at,
    fullUrl: baseUrl
      ? `${baseUrl}/register/${row.link_type}/${row.link_token}`
      : undefined,
  };
}

function toRow(patch: Partial<RegistrationLinkRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.projectId !== undefined) row.project_id = patch.projectId;
  if (patch.linkType !== undefined) row.link_type = patch.linkType;
  if (patch.linkToken !== undefined) row.link_token = patch.linkToken;
  return row;
}

export const registrationLinkKeys = {
  all: ["registrationLinks"] as const,
  forProject: (projectId: string | undefined) => [
    ...registrationLinkKeys.all,
    "forProject",
    projectId,
  ] as const,
};

export function useProjectRegistrationLinks(projectId: string | undefined) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return useQuery({
    queryKey: registrationLinkKeys.forProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_registration_links")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;

      return (data as RegistrationLinkRow[]).map((row) =>
        toRegistrationLinkRecord(row, baseUrl)
      );
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectRegistrationLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      linkType,
    }: {
      projectId: string;
      linkType: "volunteer" | "participant";
    }) => {
      // Generate a short, URL-safe token
      const token = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);

      const { data, error } = await supabase
        .from("project_registration_links")
        .insert({
          project_id: projectId,
          link_type: linkType,
          link_token: token,
        })
        .select()
        .single();

      if (error) {
        // If duplicate (link already exists), fetch existing instead
        if (error.code === "23505") {
          const { data: existing, error: fetchError } = await supabase
            .from("project_registration_links")
            .select("*")
            .eq("project_id", projectId)
            .eq("link_type", linkType)
            .single();

          if (fetchError) throw fetchError;
          return toRegistrationLinkRecord(existing as RegistrationLinkRow);
        }
        throw error;
      }

      return toRegistrationLinkRecord(data as RegistrationLinkRow);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: registrationLinkKeys.forProject(variables.projectId),
      });
    },
  });
}
