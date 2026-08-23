import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { canEditModule } from "@/lib/permissions";
import type { UserRecord } from "@/lib/queries/users";

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

// `vite dev` runs as a plain Node process, not inside Wrangler/Miniflare, so
// nothing loads `.dev.vars` into `process.env` the way a real deployed
// Cloudflare Worker does (there, `process.env` is auto-populated because
// wrangler.jsonc has `nodejs_compat` + a compatibility_date >= 2025-04-01).
// Read `.dev.vars` directly as a dev-only fallback; this whole branch is
// dead-code-eliminated from the production bundle since import.meta.env.DEV
// is statically known at build time.
async function readDevVar(name: string): Promise<string | undefined> {
  if (!import.meta.env.DEV) return undefined;
  try {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const content = readFileSync(resolve(process.cwd(), ".dev.vars"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq !== -1 && trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function getSupabaseAdmin() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? (await readDevVar("SUPABASE_SERVICE_ROLE_KEY"));
  if (!url || !serviceRoleKey) {
    throw new Error("Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY on the server.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const createUserWithAuth = createServerFn({ method: "POST" })
  .validator((input: unknown) => CreateUserInput.parse(input))
  .handler(async ({ data }) => {
    const admin = await getSupabaseAdmin();

    // Authoritative server-side gate: only a signed-in "מנהל מערכת" may
    // create users. A client-side useCanEdit("users") check alone is UI
    // only — this function is a network-reachable endpoint, so it must
    // re-verify the caller itself rather than trust what the client sent.
    const { data: caller, error: callerError } = await admin.auth.getUser(data.accessToken);
    if (callerError || !caller.user?.email) {
      throw new Error("פעולה לא מאושרת: יש להתחבר מחדש");
    }
    const { data: callerRow } = await admin
      .from("users")
      .select("role")
      .eq("email", caller.user.email)
      .single();
    if (!callerRow || !canEditModule(callerRow.role as UserRecord["role"], "users")) {
      throw new Error("אין לך הרשאה ליצור משתמשים חדשים");
    }

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
