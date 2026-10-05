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
  "מנהלת העמותה": [
    "participants",
    "volunteers",
    "donors",
    "donations",
    "projects",
    "suppliers",
    "families",
    "users",
  ],
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
  "מנהל פרויקטים": [
    "participants",
    "volunteers",
    "projects",
    "suppliers",
    "families",
  ],
  "מנהל כספים": [
    "donors",
    "donations",
    "projects",
    "suppliers",
    "families",
    "finance",
  ],
};

const ALL_MODULES: EditableModule[] = [
  "participants",
  "volunteers",
  "donors",
  "donations",
  "projects",
  "suppliers",
  "families",
  "finance",
  "users",
];

const ROLE_VIEW_MATRIX: Record<UserRecord["role"], EditableModule[]> = {
  "מנהלת העמותה": ALL_MODULES,
  "מנהל מערכת": ALL_MODULES,
  "מנהל כספים": [
    "donors",
    "donations",
    "projects",
    "suppliers",
    "families",
    "finance",
  ],
  "מנהל פרויקטים": [
    "participants",
    "volunteers",
    "projects",
    "suppliers",
    "families",
  ],
};

export function canEditModule(
  role: UserRecord["role"],
  module: EditableModule,
): boolean {
  return (ROLE_EDIT_MATRIX[role] ?? []).includes(module);
}

export function canViewModule(
  role: UserRecord["role"],
  module: EditableModule,
): boolean {
  return (ROLE_VIEW_MATRIX[role] ?? []).includes(module);
}

/** The signed-in user's staff-directory record, matched by id against the real Supabase Auth session. */
export function useCurrentUser(): UserRecord | undefined {
  const { session } = useSession();
  const { data: users } = useUsers();
  const id = session?.user.id;
  return id ? users?.find((u) => u.id === id) : undefined;
}

/** True when the signed-in user may edit records in the given module. */
export function useCanEdit(module: EditableModule): boolean {
  const user = useCurrentUser();
  return user ? canEditModule(user.role, module) : false;
}

/** True when the signed-in user may view the given module, even without edit rights. */
export function useCanView(module: EditableModule): boolean {
  const user = useCurrentUser();
  return user ? canViewModule(user.role, module) : false;
}
