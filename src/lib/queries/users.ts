import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createUserWithAuth } from "@/lib/create-user";
import { deleteUserWithAuth } from "@/lib/delete-user";
import { updateUserEmail } from "@/lib/update-user-email";

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

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accessToken }: { id: string; accessToken: string }) => {
      await deleteUserWithAuth({ data: { id, accessToken } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      accessToken: string;
      name: string;
      email: string;
      role: UserRecord["role"];
      status: UserRecord["status"];
      password?: string;
    }) => {
      const { row, generatedPassword } = await createUserWithAuth({ data: values });
      return { user: toUserRecord(row as UserRow), generatedPassword };
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
      previousEmail,
      accessToken,
    }: {
      id: string;
      patch: Partial<UserRecord>;
      previousEmail?: string;
      accessToken?: string;
    }) => {
      if (patch.email !== undefined && patch.email !== previousEmail) {
        await updateUserEmail({ data: { id, email: patch.email, accessToken: accessToken ?? "" } });
      }
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
