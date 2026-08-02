// Role-based edit permissions for the Our People platform.
// The signed-in user is mocked for now; swapping in a real session only requires
// replacing `useCurrentUser` with a query against the auth provider.
import { useSyncExternalStore } from "react";
import type { User } from "./mock-data";
import { users } from "./mock-data";

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

const ROLE_EDIT_MATRIX: Record<User["role"], EditableModule[]> = {
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

let currentUser: User = users[0];
const listeners = new Set<() => void>();

export function setCurrentUser(u: User) {
  currentUser = u;
  listeners.forEach((l) => l());
}

export function getCurrentUser() {
  return currentUser;
}

export function useCurrentUser(): User {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => currentUser,
    () => currentUser,
  );
}

export function canEditModule(role: User["role"], module: EditableModule): boolean {
  return (ROLE_EDIT_MATRIX[role] ?? []).includes(module);
}

/** True when the signed-in user may edit records in the given module. */
export function useCanEdit(module: EditableModule): boolean {
  const user = useCurrentUser();
  return canEditModule(user.role, module);
}
