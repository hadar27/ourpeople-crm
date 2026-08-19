import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: "מנהל מערכת" | "הנהלה" | "מנהל כספים" | "מנהל מתנדבים" | "מנהל קשרי תורמים";
  status: "פעיל" | "מושעה";
  lastLogin: string;
  permissions?: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_login: string | null;
  permissions: string | null;
};

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as UserRecord["role"],
    status: row.status as UserRecord["status"],
    lastLogin: row.last_login ?? "",
    permissions: row.permissions ?? undefined,
  };
}

function toRow(patch: Partial<UserRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.lastLogin !== undefined) row.last_login = patch.lastLogin || null;
  if (patch.permissions !== undefined) row.permissions = patch.permissions ?? null;
  return row;
}

export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*").order("name");
      if (error) throw error;
      return (data as UserRow[]).map(toUserRecord);
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<UserRecord>) => {
      const { data, error } = await supabase.from("users").insert(toRow(values)).select().single();
      if (error) throw error;
      return toUserRecord(data as UserRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<UserRecord> }) => {
      const { data, error } = await supabase
        .from("users")
        .update(toRow(patch))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return toUserRecord(data as UserRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}
