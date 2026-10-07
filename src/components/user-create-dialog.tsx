import {
  EntityFormDialog,
  type FormField,
} from "@/components/entity-form-dialog";
import { useCreateUser, type UserRecord } from "@/lib/queries/users";

const fields: FormField[] = [
  { name: "name", label: "שם מלא", required: true },
  { name: "email", label: "דוא״ל", type: "email", required: true },
  {
    name: "role",
    label: "תפקיד",
    type: "select",
    required: true,
    options: ["מנהלת העמותה", "מנהל מערכת", "מנהל כספים", "מנהל פרויקטים"],
  },
  {
    name: "password",
    label: "סיסמה",
    type: "password",
    required: true,
    validate: (v) => v.length >= 8 || "הסיסמה חייבת להכיל לפחות 8 תווים",
    maxLength: 128,
  },
  {
    name: "passwordConfirmation",
    label: "אימות סיסמה",
    type: "password",
    required: true,
  },
];

export function UserCreateDialog() {
  const mutation = useCreateUser();
  return (
    <EntityFormDialog
      triggerLabel="הוספת משתמש"
      title="הוספת משתמש"
      fields={fields}
      successMessage="המשתמש נוסף בהצלחה ויכול להתחבר עם הדוא״ל והסיסמה שהוגדרו"
      customValidate={(v) =>
        v.password !== v.passwordConfirmation ? "הסיסמאות אינן תואמות" : null
      }
      onCreate={async (v) => {
        try {
          return await mutation.mutateAsync({
            name: v.name.trim(),
            email: v.email.trim(),
            role: v.role as UserRecord["role"],
            password: v.password,
          });
        } catch {
          return { ok: false, error: "הוספת המשתמש נכשלה. נסו שוב." };
        }
      }}
    />
  );
}
