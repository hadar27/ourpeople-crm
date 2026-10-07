import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CreateUserInput } from "../create-user";

export async function createStaffAccount(
  admin: SupabaseClient,
  input: CreateUserInput,
) {
  const { data: caller, error: authError } = await admin.auth.getUser(
    input.accessToken,
  );
  if (authError || !caller.user)
    return { ok: false, error: "ההתחברות פגה. יש להתחבר מחדש." };

  const { data: staff, error: staffError } = await admin
    .from("users")
    .select("role,status")
    .eq("id", caller.user.id)
    .maybeSingle();
  if (
    staffError ||
    !staff ||
    staff.status !== "פעיל" ||
    !["מנהלת העמותה", "מנהל מערכת"].includes(staff.role)
  ) {
    return { ok: false, error: "אין לך הרשאה להוסיף משתמשים." };
  }

  const { data: existing, error: lookupError } = await admin
    .from("users")
    .select("id")
    .eq("email", input.email)
    .limit(1);
  if (lookupError)
    return { ok: false, error: "לא ניתן לבדוק את רשימת המשתמשים. נסו שוב." };
  if (existing?.length)
    return { ok: false, error: "כבר קיים משתמש עם כתובת הדוא״ל הזאת." };

  const { data: account, error: createError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.name },
    });
  if (createError || !account.user) {
    const duplicate =
      createError?.code === "email_exists" ||
      createError?.code === "user_already_exists";
    return {
      ok: false,
      error: duplicate
        ? "כבר קיים חשבון עם כתובת הדוא״ל הזאת."
        : "יצירת החשבון נכשלה. בדקו את פרטי המשתמש ואת דרישות הסיסמה.",
    };
  }

  const { error: insertError } = await admin.from("users").insert({
    id: account.user.id,
    name: input.name,
    email: input.email,
    role: input.role,
    status: "פעיל",
    last_login: null,
  });
  if (insertError) {
    // Never leave a usable login behind when its staff profile could not be saved.
    const { error: rollbackError } = await admin.auth.admin.deleteUser(
      account.user.id,
    );
    if (rollbackError) {
      await admin.auth.admin.updateUserById(account.user.id, {
        ban_duration: "876000h",
      });
      return {
        ok: false,
        error:
          "שמירת פרטי המשתמש נכשלה. יש לבדוק את החשבון ב-Supabase לפני ניסיון נוסף.",
      };
    }
    return {
      ok: false,
      error: "שמירת פרטי המשתמש נכשלה והחשבון החדש בוטל. נסו שוב.",
    };
  }
  return { ok: true };
}

export async function createUserOnServer(input: CreateUserInput) {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL;
  const secret =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret)
    return {
      ok: false,
      error: "הוספת משתמשים דורשת הגדרת מפתח שרת של Supabase בסביבת הפריסה.",
    };
  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return createStaffAccount(admin, input);
}
