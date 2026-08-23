import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin, requireUserAdmin } from "@/lib/server-admin";

const CreateUserInput = z.object({
  accessToken: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["מנהל מערכת", "הנהלה", "מנהל כספים", "מנהל מתנדבים", "מנהל קשרי תורמים"]),
  status: z.enum(["פעיל", "מושעה"]),
  password: z.string().min(6).optional(),
});

function randomPassword() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export const createUserWithAuth = createServerFn({ method: "POST" })
  .validator((input: unknown) => CreateUserInput.parse(input))
  .handler(async ({ data }) => {
    const admin = await getSupabaseAdmin();
    await requireUserAdmin(admin, data.accessToken);

    const generated = !data.password;
    const password = data.password ?? randomPassword();

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (authError || !authUser.user) {
      throw new Error(authError?.message ?? "יצירת חשבון ההתחברות נכשלה");
    }

    const { data: row, error: insertError } = await admin
      .from("users")
      .insert({
        id: authUser.user.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
      })
      .select()
      .single();

    if (insertError) {
      await admin.auth.admin.deleteUser(authUser.user.id); // roll back the orphaned auth account
      throw new Error(insertError.message);
    }

    return { row, generatedPassword: generated ? password : null };
  });
