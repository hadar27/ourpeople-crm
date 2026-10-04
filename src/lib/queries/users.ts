import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: "מנהלת העמותה" | "מנהל מערכת" | "מנהל כספים" | "מנהל פרויקטים";
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
  if (patch.permissions !== undefined)
    row.permissions = patch.permissions ?? null;
  return row;
}

export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("name");
      if (error) throw error;
      const { data: signIns, error: signInError } = await supabase.rpc(
        "get_user_last_sign_ins",
      );
      // Keep role resolution available before the accompanying migration is run.
      // Never fall back to the old, manually populated last_login values.
      if (signInError && !["PGRST202", "42883"].includes(signInError.code))
        throw signInError;
      const lastSignIns = new Map(
        (
          (signIns ?? []) as { user_id: string; last_login: string | null }[]
        ).map((row) => [row.user_id, row.last_login] as const),
      );
      return (data as UserRow[]).map((row) => ({
        ...toUserRecord(row),
        lastLogin: lastSignIns.get(row.id) ?? "",
      }));
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<UserRecord>;
    }) => {
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
