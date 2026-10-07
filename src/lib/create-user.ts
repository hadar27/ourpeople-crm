import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const createUserSchema = z.object({
  accessToken: z.string().min(1),
  name: z.string().trim().min(1, "יש להזין שם מלא").max(200),
  email: z
    .string()
    .trim()
    .email("כתובת הדוא״ל אינה תקינה")
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים").max(128),
  role: z.enum(["מנהלת העמותה", "מנהל מערכת", "מנהל כספים", "מנהל פרויקטים"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const createUser = createServerFn({ method: "POST" })
  .validator(createUserSchema)
  .handler(async ({ data }) => {
    const { createUserOnServer } = await import("./server/create-user.server");
    return createUserOnServer(data);
  });
