import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin, requireUserAdmin } from "@/lib/server-admin";

const UpdateUserEmailInput = z.object({
  accessToken: z.string().min(1),
  id: z.string().min(1),
  email: z.string().email(),
});

export const updateUserEmail = createServerFn({ method: "POST" })
  .validator((input: unknown) => UpdateUserEmailInput.parse(input))
  .handler(async ({ data }) => {
    const admin = await getSupabaseAdmin();
    await requireUserAdmin(admin, data.accessToken);

    const { error } = await admin.auth.admin.updateUserById(data.id, {
      email: data.email,
      email_confirm: true,
    });
    if (error) {
      throw new Error(error.message);
    }
  });
