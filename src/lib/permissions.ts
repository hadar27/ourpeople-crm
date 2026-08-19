// Role-based edit permissions for the Our People platform.
import { useSession } from "./auth";
import { useUsers, type UserRecord } from "./queries/users";

export type EditableModule =
  | "participants"
  | "volunteers"
  | "donors"
  | "donations"
  | "projects"
  | "suppliers"
  | "families"
  | "finance"
  | "users";

const ROLE_EDIT_MATRIX: Record<UserRecord["role"], EditableModule[]> = {
  "מנהל מערכת": [
    "participants",
    "volunteers",
    "donors",
    "donations",
    "projects",
    "suppliers",
    "families",
    "finance",
    "users",
  ],
  "הנהלה": ["participants", "volunteers", "donors", "donations", "projects", "suppliers", "families"],
  "מנהל כספים": ["donations", "suppliers", "finance", "projects"],
  "מנהל מתנדבים": ["volunteers", "participants"],
  "מנהל קשרי תורמים": ["donors", "donations"],
};

export function canEditModule(role: UserRecord["role"], module: EditableModule): boolean {
  return (ROLE_EDIT_MATRIX[role] ?? []).includes(module);
}

/** The signed-in user's staff-directory record, matched by email against the real Supabase Auth session. */
export function useCurrentUser(): UserRecord | undefined {
  const { session } = useSession();
  const { data: users } = useUsers();
  const email = session?.user.email;
  return email ? users?.find((u) => u.email === email) : undefined;
}

/** True when the signed-in user may edit records in the given module. */
export function useCanEdit(module: EditableModule): boolean {
  const user = useCurrentUser();
  return user ? canEditModule(user.role, module) : false;
}
