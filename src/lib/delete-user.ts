import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin, requireUserAdmin } from "@/lib/server-admin";

const DeleteUserInput = z.object({
  accessToken: z.string().min(1),
  id: z.string().min(1),
});

export const deleteUserWithAuth = createServerFn({ method: "POST" })
  .validator((input: unknown) => DeleteUserInput.parse(input))
  .handler(async ({ data }) => {
    const admin = await getSupabaseAdmin();
    await requireUserAdmin(admin, data.accessToken);

    // public.users.id has `on delete cascade` back to auth.users(id) (see
    // supabase/migrations/0003_users_auth_link.sql), so deleting the auth
    // account also removes the matching directory row in the same
    // operation — no separate delete against public.users is needed.
    const { error } = await admin.auth.admin.deleteUser(data.id);
    if (error) {
      throw new Error(error.message);
    }
  });
