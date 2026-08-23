import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { canEditModule } from "@/lib/permissions";
import type { UserRecord } from "@/lib/queries/users";

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

export async function getSupabaseAdmin(): Promise<SupabaseClient> {
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

// Authoritative server-side gate: only a signed-in "מנהל מערכת" may manage
// users. A client-side useCanEdit("users") check alone is UI only — these
// are network-reachable endpoints, so each must re-verify the caller itself
// rather than trust what the client sent.
export async function requireUserAdmin(admin: SupabaseClient, accessToken: string): Promise<void> {
  const { data: caller, error: callerError } = await admin.auth.getUser(accessToken);
  if (callerError || !caller.user?.email) {
    throw new Error("פעולה לא מאושרת: יש להתחבר מחדש");
  }
  const { data: callerRow } = await admin
    .from("users")
    .select("role")
    .eq("email", caller.user.email)
    .single();
  if (!callerRow || !canEditModule(callerRow.role as UserRecord["role"], "users")) {
    throw new Error("אין לך הרשאה לביצוע פעולה זו");
  }
}
